"""Trình khách JSON-RPC đồng bộ nhỏ cho node Bitcoin Core cục bộ.

Demo chủ động giữ adapter này tối giản: chỉ định tuyến request đến endpoint
node hoặc endpoint ví có tên, đồng thời chỉ cung cấp các RPC cần cho quy trình
trình bày Regtest. Khóa riêng tư không bao giờ đi qua client này.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
import itertools
import json
import os
from typing import Any, Final, Mapping, Sequence
from urllib.parse import quote, urlparse

import httpx
from dotenv import load_dotenv


DEFAULT_RPC_URL: Final[str] = "http://127.0.0.1:18443"
DEFAULT_RPC_WALLET: Final[str] = "demo_miner"
DEFAULT_RPC_TIMEOUT_SECONDS: Final[int] = 10


class BitcoinRPCConfigurationError(ValueError):
    """Lỗi khi cấu hình RPC cục bộ bắt buộc bị thiếu hoặc không hợp lệ."""


class BitcoinRPCError(RuntimeError):
    """Lỗi JSON-RPC do Bitcoin Core trả về.

    Exception công khai chỉ chứa method, mã số và message Core đã loại bỏ bí mật.
    Tham số request (có thể chứa giao dịch thô) và thông tin xác thực HTTP
    được chủ động loại bỏ.
    """

    def __init__(self, method: str, code: int | None, message: str) -> None:
        self.method = method
        self.code = code
        self.rpc_message = message
        code_text = f" ({code})" if code is not None else ""
        super().__init__(f"Bitcoin Core RPC {method} failed{code_text}: {message}")


class BitcoinRPCConnectionError(RuntimeError):
    """Lỗi khi không thể kết nối Bitcoin Core hoặc HTTP trả về không hợp lệ."""


@dataclass(frozen=True, slots=True)
class BitcoinRPCSettings:
    """Thiết lập kết nối không chứa dữ liệu khóa riêng tư của ví."""

    url: str
    user: str
    password: str = field(repr=False)
    wallet: str
    timeout_seconds: int


def _positive_int(raw_value: str, variable_name: str) -> int:
    try:
        parsed = int(raw_value)
    except ValueError as exc:
        raise BitcoinRPCConfigurationError(
            f"{variable_name} must be an integer"
        ) from exc
    if parsed <= 0:
        raise BitcoinRPCConfigurationError(
            f"{variable_name} must be greater than zero"
        )
    return parsed


def _validate_rpc_url(raw_url: str) -> str:
    url = raw_url.strip().rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise BitcoinRPCConfigurationError(
            "BITCOIN_RPC_URL must be an absolute HTTP(S) URL"
        )
    if parsed.username is not None or parsed.password is not None:
        raise BitcoinRPCConfigurationError(
            "Put RPC credentials in BITCOIN_RPC_USER and "
            "BITCOIN_RPC_PASSWORD, not in BITCOIN_RPC_URL"
        )
    if parsed.query or parsed.fragment:
        raise BitcoinRPCConfigurationError(
            "BITCOIN_RPC_URL must not contain a query string or fragment"
        )
    if parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise BitcoinRPCConfigurationError(
            "BITCOIN_RPC_URL must point to local Bitcoin Core"
        )
    return url


def load_bitcoin_rpc_settings(
    environ: Mapping[str, str] | None = None,
) -> BitcoinRPCSettings:
    """Nạp cấu hình kết nối Bitcoin Core từ environment được truyền vào.

    Mật khẩu không có giá trị mặc định trong source. Cấu hình được nạp lười có
    chủ đích để vẫn có thể import ứng dụng FastAPI trước khi cấu hình ``.env``.
    """

    if environ is None:
        load_dotenv(override=False)
        source: Mapping[str, str] = os.environ
    else:
        source = environ

    user = source.get("BITCOIN_RPC_USER", "").strip()
    password = source.get("BITCOIN_RPC_PASSWORD", "")
    wallet = source.get("BITCOIN_RPC_WALLET", DEFAULT_RPC_WALLET).strip()

    if not user:
        raise BitcoinRPCConfigurationError("BITCOIN_RPC_USER must not be empty")
    if not password:
        raise BitcoinRPCConfigurationError(
            "BITCOIN_RPC_PASSWORD must not be empty"
        )
    if not wallet:
        raise BitcoinRPCConfigurationError("BITCOIN_RPC_WALLET must not be empty")

    return BitcoinRPCSettings(
        url=_validate_rpc_url(source.get("BITCOIN_RPC_URL", DEFAULT_RPC_URL)),
        user=user,
        password=password,
        wallet=wallet,
        timeout_seconds=_positive_int(
            source.get(
                "BITCOIN_RPC_TIMEOUT_SECONDS",
                str(DEFAULT_RPC_TIMEOUT_SECONDS),
            ),
            "BITCOIN_RPC_TIMEOUT_SECONDS",
        ),
    )


def _encode_json(value: Any) -> str:
    """Tuần tự hóa JSON nhưng giữ ``Decimal`` là số JSON chính xác.

    Bộ mã hóa chuẩn yêu cầu đổi ``Decimal`` sang ``float``. Số tiền Bitcoin phải
    giữ nguyên độ chính xác, nên bộ mã hóa nhỏ này xử lý tập kiểu JSON giới hạn
    dùng trong RPC và từ chối hoàn toàn ``float``.
    """

    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("Decimal JSON values must be finite")
        return format(value, "f")
    if isinstance(value, float):
        raise TypeError("Use Decimal instead of float for Bitcoin RPC values")
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, (list, tuple)):
        return "[" + ",".join(_encode_json(item) for item in value) + "]"
    if isinstance(value, Mapping):
        encoded_items: list[str] = []
        for key, item in value.items():
            if not isinstance(key, str):
                raise TypeError("JSON object keys must be strings")
            encoded_items.append(
                f"{json.dumps(key, ensure_ascii=False)}:{_encode_json(item)}"
            )
        return "{" + ",".join(encoded_items) + "}"
    raise TypeError(f"Unsupported JSON value type: {type(value).__name__}")


class BitcoinRPCClient:
    """Trình khách JSON-RPC đồng bộ tối giản cho Bitcoin Core."""

    def __init__(
        self,
        url: str,
        user: str,
        password: str,
        *,
        wallet_name: str = DEFAULT_RPC_WALLET,
        timeout_seconds: int = DEFAULT_RPC_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if not user:
            raise BitcoinRPCConfigurationError("RPC user must not be empty")
        if not password:
            raise BitcoinRPCConfigurationError("RPC password must not be empty")
        if not wallet_name:
            raise BitcoinRPCConfigurationError("RPC wallet must not be empty")
        if timeout_seconds <= 0:
            raise BitcoinRPCConfigurationError(
                "RPC timeout_seconds must be greater than zero"
            )

        self.url = _validate_rpc_url(url)
        self.wallet_name = wallet_name
        self.timeout_seconds = timeout_seconds
        self._user = user
        self._password = password
        self._request_ids = itertools.count(1)
        self._client = httpx.Client(
            timeout=timeout_seconds,
            transport=transport,
            trust_env=False,
        )
        self._auth = httpx.BasicAuth(user, password)

    @classmethod
    def from_settings(
        cls,
        settings: BitcoinRPCSettings,
        *,
        transport: httpx.BaseTransport | None = None,
    ) -> "BitcoinRPCClient":
        return cls(
            settings.url,
            settings.user,
            settings.password,
            wallet_name=settings.wallet,
            timeout_seconds=settings.timeout_seconds,
            transport=transport,
        )

    @classmethod
    def from_env(
        cls,
        environ: Mapping[str, str] | None = None,
        *,
        transport: httpx.BaseTransport | None = None,
    ) -> "BitcoinRPCClient":
        return cls.from_settings(
            load_bitcoin_rpc_settings(environ),
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "BitcoinRPCClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def _redact(self, message: str) -> str:
        redacted = message
        for secret in (self._password, self._user, self.url):
            if secret:
                redacted = redacted.replace(secret, "[redacted]")
        return redacted

    def _endpoint(self, wallet_name: str | None) -> str:
        if wallet_name is None:
            return self.url
        if not wallet_name:
            raise BitcoinRPCConfigurationError("RPC wallet must not be empty")
        encoded_wallet = quote(wallet_name, safe="")
        return f"{self.url}/wallet/{encoded_wallet}"

    def call(
        self,
        method: str,
        params: Sequence[Any] | Mapping[str, Any] | None = None,
        *,
        wallet_name: str | None = None,
    ) -> Any:
        """Gọi RPC cấp node, trừ khi chỉ rõ ``wallet_name``."""

        if not method:
            raise ValueError("RPC method must not be empty")
        payload = {
            # Core hỗ trợ dạng wire JSON-RPC 1.0 trên nhiều phiên bản hơn
            # so với chế độ 2.0 mới hơn.
            "jsonrpc": "1.0",
            "id": next(self._request_ids),
            "method": method,
            "params": [] if params is None else params,
        }

        try:
            response = self._client.post(
                self._endpoint(wallet_name),
                content=_encode_json(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                auth=self._auth,
            )
        except httpx.TimeoutException:
            raise BitcoinRPCConnectionError(
                "Bitcoin Core RPC request timed out"
            ) from None
        except httpx.RequestError:
            raise BitcoinRPCConnectionError(
                "Bitcoin Core Regtest RPC is not reachable"
            ) from None

        try:
            response_payload = json.loads(response.text, parse_float=Decimal)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise BitcoinRPCConnectionError(
                f"Bitcoin Core RPC returned invalid JSON (HTTP {response.status_code})"
            ) from exc

        if not isinstance(response_payload, Mapping):
            raise BitcoinRPCConnectionError(
                "Bitcoin Core RPC returned an invalid response object"
            )

        rpc_error = response_payload.get("error")
        if rpc_error is not None:
            if isinstance(rpc_error, Mapping):
                raw_code = rpc_error.get("code")
                code = raw_code if isinstance(raw_code, int) else None
                raw_message = rpc_error.get("message", "Unknown RPC error")
                message = self._redact(str(raw_message))
            else:
                code = None
                message = "Unknown RPC error"
            raise BitcoinRPCError(method, code, message)

        if response.status_code >= 400:
            raise BitcoinRPCConnectionError(
                f"Bitcoin Core RPC returned HTTP {response.status_code}"
            )
        if "result" not in response_payload:
            raise BitcoinRPCConnectionError(
                "Bitcoin Core RPC response did not contain a result"
            )
        return response_payload["result"]

    def wallet_call(
        self,
        method: str,
        params: Sequence[Any] | Mapping[str, Any] | None = None,
        *,
        wallet_name: str | None = None,
    ) -> Any:
        """Gọi RPC trên route ví đã cấu hình hoặc route được chỉ định."""

        return self.call(
            method,
            params,
            wallet_name=self.wallet_name if wallet_name is None else wallet_name,
        )

    # Hàm hỗ trợ RPC cấp node.
    def get_blockchain_info(self) -> Mapping[str, Any]:
        return self.call("getblockchaininfo")

    def get_network_info(self) -> Mapping[str, Any]:
        return self.call("getnetworkinfo")

    def get_block_count(self) -> int:
        return int(self.call("getblockcount"))

    def list_wallets(self) -> list[str]:
        return list(self.call("listwallets"))

    def list_wallet_dir(self) -> Mapping[str, Any]:
        return self.call("listwalletdir")

    def create_wallet(self, wallet_name: str) -> Mapping[str, Any]:
        return self.call("createwallet", {"wallet_name": wallet_name})

    def load_wallet(self, wallet_name: str) -> Mapping[str, Any]:
        return self.call("loadwallet", {"filename": wallet_name})

    def generate_to_address(self, blocks: int, address: str) -> list[str]:
        return list(self.call("generatetoaddress", [blocks, address]))

    def scan_tx_out_set(
        self,
        action: str,
        scan_objects: Sequence[str | Mapping[str, Any]],
    ) -> Mapping[str, Any]:
        return self.call("scantxoutset", [action, scan_objects])

    def decode_raw_transaction(self, raw_transaction: str) -> Mapping[str, Any]:
        return self.call("decoderawtransaction", [raw_transaction])

    def test_mempool_accept(self, raw_transaction: str) -> list[Mapping[str, Any]]:
        """Hỏi Bitcoin Core giao dịch thô có được Mempool chấp nhận không."""

        result = self.call("testmempoolaccept", [[raw_transaction]])
        if not isinstance(result, list) or any(
            not isinstance(item, Mapping) for item in result
        ):
            raise BitcoinRPCConnectionError(
                "Bitcoin Core returned an invalid testmempoolaccept response"
            )
        return result

    def send_raw_transaction(self, raw_transaction: str) -> str:
        return str(self.call("sendrawtransaction", [raw_transaction]))

    def get_raw_transaction(
        self,
        txid: str,
        *,
        verbose: bool = True,
    ) -> Any:
        return self.call("getrawtransaction", [txid, verbose])

    def get_block_header(
        self,
        block_hash: str,
        *,
        verbose: bool = True,
    ) -> Any:
        return self.call("getblockheader", [block_hash, verbose])

    # Hàm hỗ trợ RPC cấp ví.
    def get_new_address(
        self,
        *,
        label: str = "",
        address_type: str = "bech32",
        wallet_name: str | None = None,
    ) -> str:
        return str(
            self.wallet_call(
                "getnewaddress",
                [label, address_type],
                wallet_name=wallet_name,
            )
        )

    def get_balance(self, *, wallet_name: str | None = None) -> Decimal:
        result = self.wallet_call("getbalance", wallet_name=wallet_name)
        if isinstance(result, float):
            # Client tùy chỉnh không nên phân tích JSON theo cách này, nhưng vẫn
            # từ chối kiểu làm mất độ chính xác nếu test double trả về.
            raise TypeError("Bitcoin Core balance must not be represented as float")
        return Decimal(str(result))

    def get_addresses_by_label(
        self,
        label: str,
        *,
        wallet_name: str | None = None,
    ) -> Mapping[str, Any]:
        return self.wallet_call(
            "getaddressesbylabel",
            [label],
            wallet_name=wallet_name,
        )

    def send_to_address(
        self,
        address: str,
        amount_btc: Decimal,
        *,
        wallet_name: str | None = None,
    ) -> str:
        if not isinstance(amount_btc, Decimal):
            raise TypeError("amount_btc must be Decimal")
        return str(
            self.wallet_call(
                "sendtoaddress",
                [address, amount_btc],
                wallet_name=wallet_name,
            )
        )


__all__ = [
    "BitcoinRPCClient",
    "BitcoinRPCConfigurationError",
    "BitcoinRPCConnectionError",
    "BitcoinRPCError",
    "BitcoinRPCSettings",
    "DEFAULT_RPC_TIMEOUT_SECONDS",
    "DEFAULT_RPC_URL",
    "DEFAULT_RPC_WALLET",
    "load_bitcoin_rpc_settings",
]
