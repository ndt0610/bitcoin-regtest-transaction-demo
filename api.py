"""Cầu nối FastAPI cục bộ cho demo giao dịch Bitcoin Core Regtest."""

from __future__ import annotations

from collections.abc import Callable, Iterator, Mapping
from typing import Any, Final

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from address.address import SUPPORTED_NETWORKS, derive_all_addresses
from crypto.keys import (
    generate_private_key,
    private_key_from_hex,
    private_key_to_hex,
    private_key_to_public_key,
)
from network.bitcoin_rpc import (
    BitcoinRPCClient,
    BitcoinRPCConfigurationError,
    BitcoinRPCConnectionError,
    BitcoinRPCError,
)
from network.regtest import (
    RegtestService,
    RegtestServiceError,
    WrongBitcoinNetworkError,
)
from transaction.coin_selection import select_utxos
from transaction.models import InsufficientFundsError
from transaction.script import address_to_script_pub_key
from transaction.signer import build_and_sign_transaction


TESTNET_NETWORK: Final[str] = "testnet"
REGTEST_NETWORK: Final[str] = "regtest"
INVALID_PRIVATE_KEY_MESSAGE: Final[str] = "Khóa riêng tư secp256k1 không hợp lệ."
LOCAL_FRONTEND_ORIGINS: Final[tuple[str, ...]] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


class HealthResponse(BaseModel):
    status: str
    network: str


class ImportPrivateKeyRequest(BaseModel):
    privateKey: Any = None
    network: str = TESTNET_NETWORK


class AddressResponse(BaseModel):
    p2pkh: str
    p2shP2wpkh: str
    p2wpkh: str
    p2tr: str = ""


class WalletResponse(BaseModel):
    network: str
    privateKey: str
    publicKey: str
    addresses: AddressResponse


class InitializeRequest(BaseModel):
    bootstrap: bool = False


class MineRequest(BaseModel):
    blocks: int = Field(ge=1, le=10_000)


class AddressBundle(BaseModel):
    p2pkh: str
    p2shP2wpkh: str
    p2wpkh: str
    p2tr: str | None = None

    def as_mapping(self) -> dict[str, str]:
        return {k: v for k, v in self.model_dump().items() if v is not None}


class AmountBundle(BaseModel):
    p2pkh: int = Field(gt=0)
    p2shP2wpkh: int = Field(gt=0)
    p2wpkh: int = Field(gt=0)
    p2tr: int | None = Field(default=None, gt=0)

    def as_mapping(self) -> dict[str, int]:
        return {k: v for k, v in self.model_dump().items() if v is not None}


class FaucetRequest(BaseModel):
    addresses: AddressBundle
    amountsSat: AmountBundle
    mineBlock: bool = False


class UtxoRequest(BaseModel):
    addresses: AddressBundle


class SelectionRequest(UtxoRequest):
    recipient: str
    amountSat: int = Field(gt=0)
    feeRateSatVb: int = Field(gt=0)


class CreateTransactionRequest(BaseModel):
    privateKey: Any = None
    recipient: str
    amountSat: int = Field(gt=0)
    feeRateSatVb: int = Field(gt=0)


class BroadcastRequest(BaseModel):
    rawTransaction: str
    expectedTxid: str = Field(min_length=64, max_length=64)


app = FastAPI(
    title="API demo giao dịch Bitcoin Core Regtest",
    description="Cầu nối cục bộ giữa React, FastAPI và Bitcoin Core phục vụ học tập.",
    version="0.4.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(LOCAL_FRONTEND_ORIGINS),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def get_regtest_service() -> Iterator[RegtestService]:
    """Tạo RPC client cục bộ ngắn hạn mà không để lộ thông tin xác thực."""
    try:
        client = BitcoinRPCClient.from_env()
    except BitcoinRPCConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_local_error_message(exc),
        ) from None

    try:
        yield RegtestService(client)
    finally:
        client.close()


def _local_error_message(exc: Exception) -> str:
    """Đổi lỗi nội bộ thành thông báo tiếng Việt an toàn cho người dùng."""

    if isinstance(exc, WrongBitcoinNetworkError):
        return (
            f"Bitcoin Core đang chạy trên mạng {exc.actual_chain!r}; "
            "dự án chỉ hỗ trợ regtest."
        )
    if isinstance(exc, BitcoinRPCConnectionError):
        return (
            "Không thể kết nối Bitcoin Core Regtest. "
            "Kiểm tra node, cổng RPC và thông tin xác thực."
        )
    if isinstance(exc, BitcoinRPCError):
        code = f" (mã {exc.code})" if exc.code is not None else ""
        return f"Bitcoin Core báo lỗi RPC {exc.method}{code}: {exc.rpc_message}"
    if isinstance(exc, InsufficientFundsError):
        return (
            f"Số dư UTXO không đủ: cần ít nhất {exc.required_sat:,} sat, "
            f"hiện có {exc.available_sat:,} sat."
        )
    if isinstance(exc, RegtestServiceError):
        raw = str(exc)
        if raw.startswith("Bitcoin Core mempool rejection: "):
            return f"Bitcoin Core từ chối giao dịch: {raw.split(': ', 1)[1]}"
        translations = {
            "signed transaction failed backend accounting or signature verification":
                "Giao dịch đã ký không vượt qua kiểm tra kế toán hoặc chữ ký.",
            "Bitcoin Core returned an invalid UTXO":
                "Bitcoin Core trả về UTXO không hợp lệ.",
            "Bitcoin Core returned an invalid transaction status":
                "Bitcoin Core trả về trạng thái giao dịch không hợp lệ.",
            "Bitcoin Core returned an invalid block header":
                "Bitcoin Core trả về thông tin block không hợp lệ.",
            "Bitcoin Core adapter does not support testmempoolaccept":
                "Bộ kết nối Bitcoin Core không hỗ trợ testmempoolaccept.",
            "Bitcoin Core returned an invalid testmempoolaccept result":
                "Bitcoin Core trả về kết quả testmempoolaccept không hợp lệ.",
        }
        if raw in translations:
            return translations[raw]
        if raw.startswith("UTXO scan did not complete for "):
            return f"Không thể hoàn tất quét UTXO cho {raw.rsplit(' ', 1)[-1]}."
        return f"Thao tác Regtest không hợp lệ. Chi tiết kỹ thuật: {raw}"
    if isinstance(exc, ValueError):
        raw = str(exc)
        if raw == "at least one UTXO is required":
            return "Không tìm thấy UTXO khả dụng."
        if "address is not" in raw.lower() or (
            "address" in raw.lower() and "script" in raw.lower()
        ):
            return "Địa chỉ nhận không hợp lệ."
        if raw.startswith("rawTransaction"):
            return "Giao dịch thô không hợp lệ."
        if raw.startswith("txid"):
            return "TXID không hợp lệ."
        return f"Dữ liệu không hợp lệ. Chi tiết kỹ thuật: {raw}"
    if isinstance(exc, TypeError):
        return f"Kiểu dữ liệu không hợp lệ. Chi tiết kỹ thuật: {exc}"
    return "Thao tác cục bộ thất bại."


def _run_local_operation(operation: Callable[[], Any]) -> Any:
    """Đưa lỗi RPC/nghiệp vụ cục bộ về HTTP error ngắn gọn, an toàn."""
    try:
        return operation()
    except WrongBitcoinNetworkError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_local_error_message(exc),
        ) from None
    except BitcoinRPCConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_local_error_message(exc),
        ) from None
    except BitcoinRPCError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_local_error_message(exc),
        ) from None
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_local_error_message(exc),
        ) from None
    except (RegtestServiceError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_local_error_message(exc),
        ) from None


def _prevent_secret_caching(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"


def _network_name(value: str) -> str:
    normalized = value.strip().lower() if isinstance(value, str) else ""
    if normalized not in SUPPORTED_NETWORKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mạng phải là 'testnet' hoặc 'regtest'.",
        )
    return normalized


def _validate_regtest_addresses(addresses: Mapping[str, str]) -> None:
    """Kiểm tra từng địa chỉ trước khi gửi đến ví hoặc RPC chain."""

    for address_type, address in addresses.items():
        try:
            address_to_script_pub_key(address.strip(), REGTEST_NETWORK)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Địa chỉ Regtest {address_type} không hợp lệ.",
            ) from exc


def _build_wallet_response(private_key: bytes, network: str) -> WalletResponse:
    public_key = private_key_to_public_key(private_key)
    addresses = derive_all_addresses(private_key, network)
    return WalletResponse(
        network=network,
        privateKey=private_key_to_hex(private_key),
        publicKey=public_key.hex(),
        addresses=AddressResponse(
            p2pkh=addresses.p2pkh,
            p2shP2wpkh=addresses.p2sh_p2wpkh,
            p2wpkh=addresses.p2wpkh,
            p2tr=addresses.p2tr,
        ),
    )


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Giữ contract kiểm tra sẵn sàng cũ cho các test Testnet legacy."""
    return HealthResponse(status="ok", network=TESTNET_NETWORK)


@app.post("/api/wallet/generate", response_model=WalletResponse)
def generate_wallet(
    response: Response,
    network: str = Query(default=TESTNET_NETWORK),
) -> WalletResponse:
    normalized_network = _network_name(network)
    _prevent_secret_caching(response)
    return _build_wallet_response(generate_private_key(), normalized_network)


@app.post("/api/wallet/import", response_model=WalletResponse)
def import_wallet(
    request: ImportPrivateKeyRequest,
    response: Response,
) -> WalletResponse:
    try:
        private_key = private_key_from_hex(request.privateKey)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_PRIVATE_KEY_MESSAGE,
        ) from None
    normalized_network = _network_name(request.network)
    _prevent_secret_caching(response)
    return _build_wallet_response(private_key, normalized_network)


@app.get("/api/regtest/status")
def regtest_status(
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    payload = _run_local_operation(service.status)
    return {**payload, "network": REGTEST_NETWORK}


@app.post("/api/regtest/initialize")
def regtest_initialize(
    request: InitializeRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    return _run_local_operation(
        lambda: service.initialize(bootstrap=request.bootstrap)
    )


@app.post("/api/regtest/mine")
def regtest_mine(
    request: MineRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    return _run_local_operation(lambda: service.mine(request.blocks))


@app.post("/api/regtest/faucet")
def regtest_faucet(
    request: FaucetRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    _validate_regtest_addresses(request.addresses.as_mapping())
    return _run_local_operation(
        lambda: service.faucet(
            request.addresses.as_mapping(),
            request.amountsSat.as_mapping(),
            mine_confirmation=request.mineBlock,
        )
    )


@app.post("/api/regtest/utxos")
def regtest_utxos(
    request: UtxoRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    _validate_regtest_addresses(request.addresses.as_mapping())
    return {
        "network": REGTEST_NETWORK,
        "utxos": _run_local_operation(
            lambda: service.fetch_utxos(request.addresses.as_mapping())
        ),
    }


@app.post("/api/transaction/select")
def transaction_select(
    request: SelectionRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    def select() -> dict[str, Any]:
        utxos = service.fetch_utxos(request.addresses.as_mapping())
        recipient_script = address_to_script_pub_key(
            request.recipient,
            REGTEST_NETWORK,
        )
        change_script = address_to_script_pub_key(
            request.addresses.p2wpkh,
            REGTEST_NETWORK,
        )
        selection = select_utxos(
            utxos,
            request.amountSat,
            request.feeRateSatVb,
            recipient_script_size=len(recipient_script),
            change_script_size=len(change_script),
        )
        return {
            "network": REGTEST_NETWORK,
            "selection": selection.to_dict(),
        }

    return _run_local_operation(select)


@app.post("/api/transaction/create")
def transaction_create(
    request: CreateTransactionRequest,
    response: Response,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    try:
        private_key = private_key_from_hex(request.privateKey)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_PRIVATE_KEY_MESSAGE,
        ) from None

    _prevent_secret_caching(response)

    def create() -> dict[str, Any]:
        addresses = derive_all_addresses(private_key, REGTEST_NETWORK)
        address_map = {
            "p2pkh": addresses.p2pkh,
            "p2shP2wpkh": addresses.p2sh_p2wpkh,
            "p2wpkh": addresses.p2wpkh,
        }
        utxos = service.fetch_utxos(address_map)
        built = build_and_sign_transaction(
            private_key,
            request.recipient,
            utxos,
            request.amountSat,
            request.feeRateSatVb,
            network=REGTEST_NETWORK,
        )
        selection = built.get("selection", {})
        signatures = built.get("signatures", [])
        signed_transaction = built.get("signedTransaction", {})
        if (
            not isinstance(selection, dict)
            or not isinstance(signatures, list)
            or not isinstance(signed_transaction, dict)
            or selection.get("selectedInputCount") != len(signatures)
            or len(signed_transaction.get("inputs", [])) != len(signatures)
            or not built.get("rawTransaction")
            or built.get("changeSat", -1) < 0
            or built.get("totalInputSat")
            != built.get("totalOutputSat") + built.get("feeSat")
        ):
            raise RegtestServiceError(
                "signed transaction failed backend accounting or signature verification"
            )

        # Service thật thực hiện cả decoderawtransaction và testmempoolaccept.
        # Kiểm tra khả năng hỗ trợ giúp service double của unit test tách khỏi node thật.
        preflight_method = getattr(service, "preflight", None)
        if callable(preflight_method):
            built["preflight"] = preflight_method(
                built["rawTransaction"],
                expected_txid=built["txid"],
            )
        built["requiredSignatures"] = len(signatures)
        built["signedSignatures"] = len(signatures)
        return built

    return _run_local_operation(create)


@app.post("/api/transaction/broadcast")
def transaction_broadcast(
    request: BroadcastRequest,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    def broadcast() -> dict[str, Any]:
        preflight_method = getattr(service, "preflight", None)
        if callable(preflight_method):
            preflight_method(
                request.rawTransaction,
                expected_txid=request.expectedTxid,
            )
        return service.broadcast(
            request.rawTransaction,
            expected_txid=request.expectedTxid,
        )

    return _run_local_operation(broadcast)


@app.get("/api/transaction/{txid}/status")
def transaction_status(
    txid: str,
    service: RegtestService = Depends(get_regtest_service),
) -> dict[str, Any]:
    return _run_local_operation(lambda: service.transaction_status(txid))
