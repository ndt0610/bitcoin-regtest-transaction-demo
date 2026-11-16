"""Các thao tác Bitcoin Core Regtest phục vụ ứng dụng demo cục bộ."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
import string
from typing import Any, Final, Mapping

from bitcoin.core import CTransaction, b2lx

from network.bitcoin_rpc import BitcoinRPCClient, BitcoinRPCError


SATOSHIS_PER_BTC: Final[int] = 100_000_000
SUPPORTED_ADDRESS_TYPES: Final[tuple[str, ...]] = (
    "p2pkh",
    "p2shP2wpkh",
    "p2wpkh",
    "p2tr",
)
MINER_LABEL: Final[str] = "bitcoin-demo-miner"
RECIPIENT_LABEL: Final[str] = "bitcoin-demo-recipient"


class RegtestServiceError(RuntimeError):
    """Lỗi khi trạng thái hoặc dữ liệu đầu vào của service Regtest không hợp lệ."""


class WrongBitcoinNetworkError(RegtestServiceError):
    """Lỗi khi node được cấu hình không chạy chain Regtest."""

    def __init__(self, actual_chain: str) -> None:
        self.actual_chain = actual_chain
        super().__init__(
            f"Bitcoin Core must use regtest; connected node reports {actual_chain!r}"
        )


def satoshi_to_btc(amount_sat: int) -> Decimal:
    """Đổi số satoshi nguyên không âm sang BTC Decimal chính xác."""

    if isinstance(amount_sat, bool) or not isinstance(amount_sat, int):
        raise TypeError("Satoshi amount must be an integer")
    if amount_sat < 0:
        raise ValueError("Satoshi amount must not be negative")
    return Decimal(amount_sat) / Decimal(SATOSHIS_PER_BTC)


def btc_to_satoshi(amount_btc: Decimal | str | int) -> int:
    """Đổi lượng BTC chính xác sang satoshi, từ chối giá trị nhỏ hơn 1 satoshi."""

    if isinstance(amount_btc, bool) or isinstance(amount_btc, float):
        raise TypeError("BTC amount must use Decimal, string, or integer")
    try:
        amount = amount_btc if isinstance(amount_btc, Decimal) else Decimal(amount_btc)
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError("Invalid BTC amount") from exc
    if not amount.is_finite():
        raise ValueError("BTC amount must be finite")
    if amount < 0:
        raise ValueError("BTC amount must not be negative")

    satoshis = amount * Decimal(SATOSHIS_PER_BTC)
    integral_satoshis = satoshis.to_integral_value()
    if satoshis != integral_satoshis:
        raise ValueError("BTC amount has more than eight decimal places")
    return int(integral_satoshis)


def _require_positive_int(value: int, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field_name} must be an integer")
    if value <= 0:
        raise ValueError(f"{field_name} must be greater than zero")
    return value


def _validate_address_maps(
    addresses: Mapping[str, str],
    amounts_sat: Mapping[str, int] | None = None,
) -> tuple[str, ...]:
    if not addresses:
        raise ValueError("At least one address is required")
    address_types = tuple(addresses.keys())
    unsupported = set(address_types).difference(SUPPORTED_ADDRESS_TYPES)
    if unsupported:
        names = ", ".join(sorted(unsupported))
        raise ValueError(f"Unsupported address type(s): {names}")
    for address_type, address in addresses.items():
        if not isinstance(address, str) or not address.strip():
            raise ValueError(f"Address for {address_type} must not be empty")

    if amounts_sat is not None:
        if set(amounts_sat) != set(addresses):
            raise ValueError("addresses and amountsSat must contain the same keys")
        for address_type, amount_sat in amounts_sat.items():
            _require_positive_int(amount_sat, f"amountsSat.{address_type}")
    return address_types


def _is_hex(value: str, length: int | None = None) -> bool:
    if length is not None and len(value) != length:
        return False
    return bool(value) and all(character in string.hexdigits for character in value)


class RegtestService:
    """Điều phối các thao tác RPC thật dùng trong quy trình UI."""

    def __init__(
        self,
        rpc: BitcoinRPCClient,
        *,
        wallet_name: str | None = None,
    ) -> None:
        self.rpc = rpc
        self.wallet_name = wallet_name or rpc.wallet_name
        self._miner_address: str | None = None
        self._demo_recipient_address: str | None = None

    def _assert_regtest(self) -> Mapping[str, Any]:
        info = self.rpc.get_blockchain_info()
        chain = str(info.get("chain", "unknown"))
        if chain != "regtest":
            raise WrongBitcoinNetworkError(chain)
        return info

    def status(self) -> dict[str, Any]:
        """Trả về trạng thái node trực tiếp mà không tạo hoặc nạp ví."""

        info = self._assert_regtest()
        loaded_wallets = self.rpc.list_wallets()
        wallet_loaded = self.wallet_name in loaded_wallets
        balance_sat = 0
        if wallet_loaded:
            balance_sat = btc_to_satoshi(
                self.rpc.get_balance(wallet_name=self.wallet_name)
            )
        result: dict[str, Any] = {
            "online": True,
            "chain": "regtest",
            "blocks": int(info["blocks"])
            if info.get("blocks") is not None
            else self.rpc.get_block_count(),
            "wallet": self.wallet_name,
            "walletLoaded": wallet_loaded,
            "minerBalanceSat": balance_sat,
        }
        get_network_info = getattr(self.rpc, "get_network_info", None)
        if callable(get_network_info):
            network_info = get_network_info()
            subversion = network_info.get("subversion")
            if isinstance(subversion, str) and subversion.strip():
                version = subversion.strip("/")
                if ":" in version:
                    version = version.split(":", 1)[1]
                result["bitcoinCoreVersion"] = version
        return result

    # Alias mô tả rõ hơn khi dùng trong phần phụ thuộc của FastAPI.
    get_status = status

    def ensure_wallet(self) -> str:
        """Tạo ví thợ đào demo một lần hoặc nạp ví nếu đã tồn tại."""

        self._assert_regtest()
        if self.wallet_name in self.rpc.list_wallets():
            return "already_loaded"

        wallet_dir = self.rpc.list_wallet_dir()
        entries = wallet_dir.get("wallets", [])
        existing_names = {
            str(entry.get("name"))
            for entry in entries
            if isinstance(entry, Mapping) and entry.get("name") is not None
        }
        if self.wallet_name in existing_names:
            self.rpc.load_wallet(self.wallet_name)
            return "loaded"

        self.rpc.create_wallet(self.wallet_name)
        return "created"

    def _address_for_label(self, label: str) -> str:
        try:
            labeled_addresses = self.rpc.get_addresses_by_label(
                label,
                wallet_name=self.wallet_name,
            )
        except BitcoinRPCError as exc:
            # Một số phiên bản Core dùng RPC_INVALID_ADDRESS_OR_KEY (-5),
            # số khác dùng RPC_WALLET_ERROR (-4) khi label chưa có địa chỉ.
            if exc.code not in {-4, -5, -11}:
                raise
        else:
            if labeled_addresses:
                return str(next(iter(labeled_addresses)))

        return self.rpc.get_new_address(
            label=label,
            address_type="bech32",
            wallet_name=self.wallet_name,
        )

    def _get_miner_address(self) -> str:
        if self._miner_address is None:
            self._miner_address = self._address_for_label(MINER_LABEL)
        return self._miner_address

    def _get_demo_recipient_address(self) -> str:
        if self._demo_recipient_address is None:
            self._demo_recipient_address = self._address_for_label(RECIPIENT_LABEL)
        return self._demo_recipient_address

    def initialize(self, *, bootstrap: bool = False) -> dict[str, Any]:
        """Đảm bảo ví thợ đào và tùy chọn tạo coin Regtest đủ điều kiện chi.

        Chế độ bootstrap chỉ đào 101 block khi ví chưa có số dư có thể chi.
        Vì vậy, khởi tạo lặp lại không tiếp tục đào thêm 101 block sau khi
        bootstrap thành công.
        """

        wallet_action = self.ensure_wallet()
        miner_address = self._get_miner_address()
        recipient_address = self._get_demo_recipient_address()
        balance_sat = btc_to_satoshi(
            self.rpc.get_balance(wallet_name=self.wallet_name)
        )
        current_height = self.rpc.get_block_count()
        block_hashes: list[str] = []
        if bootstrap and balance_sat == 0 and current_height < 101:
            block_hashes = self.rpc.generate_to_address(101, miner_address)
            balance_sat = btc_to_satoshi(
                self.rpc.get_balance(wallet_name=self.wallet_name)
            )

        return {
            "wallet": self.wallet_name,
            "walletAction": wallet_action,
            "minerAddress": miner_address,
            "demoRecipientAddress": recipient_address,
            "blockHeight": self.rpc.get_block_count(),
            "blocksMined": len(block_hashes),
            "balanceSat": balance_sat,
        }

    def mine(self, blocks: int) -> dict[str, Any]:
        """Đào số block yêu cầu về địa chỉ ví thợ đào demo."""

        _require_positive_int(blocks, "blocks")
        self.ensure_wallet()
        miner_address = self._get_miner_address()
        block_hashes = self.rpc.generate_to_address(blocks, miner_address)
        return {
            "minerAddress": miner_address,
            "blockHeight": self.rpc.get_block_count(),
            "blocksMined": len(block_hashes),
            "lastBlockHash": block_hashes[-1] if block_hashes else None,
            "balanceSat": btc_to_satoshi(
                self.rpc.get_balance(wallet_name=self.wallet_name)
            ),
        }

    def faucet(
        self,
        addresses: Mapping[str, str],
        amounts_sat: Mapping[str, int],
        *,
        mine_confirmation: bool = True,
    ) -> dict[str, Any]:
        """Cấp coin từ ví Core cho từng địa chỉ demo bằng lượng BTC chính xác."""

        address_types = _validate_address_maps(addresses, amounts_sat)
        self.ensure_wallet()

        funding: list[dict[str, Any]] = []
        for address_type in address_types:
            address = addresses[address_type].strip()
            amount_sat = amounts_sat[address_type]
            txid = self.rpc.send_to_address(
                address,
                satoshi_to_btc(amount_sat),
                wallet_name=self.wallet_name,
            )
            funding.append(
                {
                    "addressType": address_type,
                    "address": address,
                    "amountSat": amount_sat,
                    "txid": txid,
                }
            )

        block_hashes: list[str] = []
        if mine_confirmation:
            block_hashes = self.rpc.generate_to_address(1, self._get_miner_address())

        confirmations: dict[str, int] = {}
        funding_txids: dict[str, str] = {}
        for item in funding:
            txid = str(item["txid"])
            decoded = self.rpc.get_raw_transaction(txid, verbose=True)
            confirmation_count = int(decoded.get("confirmations", 0))
            item["confirmations"] = confirmation_count
            item["status"] = "confirmed" if confirmation_count > 0 else "unconfirmed"
            address_type = str(item["addressType"])
            confirmations[address_type] = confirmation_count
            funding_txids[address_type] = txid

        return {
            "fundingTxids": funding_txids,
            "funding": funding,
            "amountsSat": dict(amounts_sat),
            "blockHeight": self.rpc.get_block_count(),
            "blocksMined": len(block_hashes),
            "confirmations": confirmations,
        }

    def fetch_utxos(self, addresses: Mapping[str, str]) -> list[dict[str, Any]]:
        """Tìm UTXO đã xác nhận bằng ``scantxoutset`` theo descriptor của Core."""

        address_types = _validate_address_maps(addresses)
        info = self._assert_regtest()
        tip_height = (
            int(info["blocks"])
            if info.get("blocks") is not None
            else self.rpc.get_block_count()
        )
        utxos: list[dict[str, Any]] = []

        for address_type in address_types:
            address = addresses[address_type].strip()
            scan = self.rpc.scan_tx_out_set("start", [f"addr({address})"])
            if not bool(scan.get("success", False)):
                raise RegtestServiceError(
                    f"UTXO scan did not complete for {address_type}"
                )

            for raw_utxo in scan.get("unspents", []):
                if not isinstance(raw_utxo, Mapping):
                    raise RegtestServiceError("Bitcoin Core returned an invalid UTXO")
                block_height_value = raw_utxo.get("height")
                block_height = (
                    int(block_height_value)
                    if block_height_value is not None
                    else None
                )
                confirmations = (
                    max(0, tip_height - block_height + 1)
                    if block_height is not None and block_height > 0
                    else 0
                )
                utxos.append(
                    {
                        "txid": str(raw_utxo["txid"]),
                        "vout": int(raw_utxo["vout"]),
                        "valueSat": btc_to_satoshi(raw_utxo["amount"]),
                        "scriptPubKey": str(raw_utxo["scriptPubKey"]),
                        "confirmations": confirmations,
                        "blockHeight": block_height,
                        "address": address,
                        "addressType": address_type,
                    }
                )

        return sorted(utxos, key=lambda item: (item["txid"], item["vout"]))

    # Alias ngắn khớp với tên resource của API.
    utxos = fetch_utxos

    def broadcast(
        self,
        raw_transaction: str,
        *,
        expected_txid: str | None = None,
    ) -> dict[str, str]:
        """Gửi giao dịch đã tuần tự hóa vào Mempool Regtest cục bộ."""

        return self._broadcast(raw_transaction, expected_txid=expected_txid)

    def _broadcast(
        self,
        raw_transaction: str,
        *,
        expected_txid: str | None = None,
    ) -> dict[str, str]:
        """Phát giao dịch sau khi tùy chọn kiểm tra TXID cục bộ/RPC.

        Nhánh không có TXID kỳ vọng được giữ lại cho service double nhỏ của test
        legacy. Luồng HTTP thật luôn cung cấp TXID do bước tạo bằng SDK trả về,
        nên không thể báo thành công khi TXID không khớp.
        """

        raw_transaction = raw_transaction.strip()
        if len(raw_transaction) % 2 != 0 or not _is_hex(raw_transaction):
            raise ValueError("rawTransaction must be non-empty even-length hex")
        self._assert_regtest()
        local_txid: str | None = None
        if expected_txid is not None:
            expected_txid = expected_txid.strip().lower()
            if not _is_hex(expected_txid, 64):
                raise ValueError("expectedTxid must be exactly 64 hexadecimal characters")
            try:
                local_txid = b2lx(
                    CTransaction.deserialize(bytes.fromhex(raw_transaction)).GetTxid()
                )
            except Exception as exc:
                raise ValueError("rawTransaction is not a valid Bitcoin transaction") from exc
            if local_txid != expected_txid:
                raise RegtestServiceError(
                    "local TXID does not match the transaction prepared for broadcast"
                )

        rpc_txid = self.rpc.send_raw_transaction(raw_transaction)
        if local_txid is not None and rpc_txid.lower() != local_txid:
            raise RegtestServiceError(
                "Bitcoin Core returned a TXID different from the locally calculated TXID"
            )
        if local_txid is None:
            return {"txid": rpc_txid}
        return {"txid": rpc_txid, "localTxid": local_txid}

    def preflight(
        self,
        raw_transaction: str,
        *,
        expected_txid: str | None = None,
    ) -> dict[str, Any]:
        """Giải mã và kiểm tra Mempool trước khi UI được phép phát giao dịch."""

        raw_transaction = raw_transaction.strip()
        if len(raw_transaction) % 2 != 0 or not _is_hex(raw_transaction):
            raise ValueError("rawTransaction must be non-empty even-length hex")
        self._assert_regtest()
        try:
            local_txid = b2lx(
                CTransaction.deserialize(bytes.fromhex(raw_transaction)).GetTxid()
            )
        except Exception as exc:
            raise ValueError("rawTransaction is not a valid Bitcoin transaction") from exc
        if expected_txid is not None and local_txid != expected_txid.strip().lower():
            raise RegtestServiceError(
                "local TXID does not match the transaction prepared for preflight"
            )

        decoded = self.rpc.decode_raw_transaction(raw_transaction)
        decoded_txid = str(decoded.get("txid", "")) if isinstance(decoded, Mapping) else ""
        if decoded_txid and decoded_txid != local_txid:
            raise RegtestServiceError(
                "Bitcoin Core decoder returned a TXID different from the SDK transaction"
            )

        test_method = getattr(self.rpc, "test_mempool_accept", None)
        if not callable(test_method):
            # Bitcoin Core v31 có RPC này. Báo lỗi rõ ràng nếu adapter không tương thích,
            # không âm thầm coi giao dịch là được chấp nhận.
            raise RegtestServiceError(
                "Bitcoin Core adapter does not support testmempoolaccept"
            )
        test_results = test_method(raw_transaction)
        if len(test_results) != 1:
            raise RegtestServiceError(
                "Bitcoin Core returned an invalid testmempoolaccept result"
            )
        result = test_results[0]
        allowed = result.get("allowed") is True
        reject_reason = result.get("reject-reason")
        if not allowed:
            reason = str(reject_reason or "Bitcoin Core rejected the transaction")
            raise RegtestServiceError(f"Bitcoin Core mempool rejection: {reason}")

        return {
            "allowed": True,
            "txid": local_txid,
            "decodedTxid": decoded_txid or local_txid,
            "decodedInputCount": len(decoded.get("vin", [])) if isinstance(decoded, Mapping) else None,
            "decodedOutputCount": len(decoded.get("vout", [])) if isinstance(decoded, Mapping) else None,
            "decodedSize": decoded.get("size") if isinstance(decoded, Mapping) else None,
            "decodedVSize": decoded.get("vsize") if isinstance(decoded, Mapping) else None,
        }

    def transaction_status(self, txid: str) -> dict[str, Any]:
        """Trả về trạng thái Mempool/xác nhận từ Core, gồm cả chiều cao block."""

        txid = txid.strip().lower()
        if not _is_hex(txid, 64):
            raise ValueError("txid must be exactly 64 hexadecimal characters")
        self._assert_regtest()
        try:
            decoded = self.rpc.get_raw_transaction(txid, verbose=True)
        except BitcoinRPCError as exc:
            if exc.code in {-5, -8}:
                return {
                    "txid": txid,
                    "status": "unknown",
                    "confirmations": None,
                    "blockHash": None,
                    "blockHeight": None,
                }
            raise
        if not isinstance(decoded, Mapping):
            raise RegtestServiceError(
                "Bitcoin Core returned an invalid transaction status"
            )

        confirmations = max(0, int(decoded.get("confirmations", 0)))
        block_hash_value = decoded.get("blockhash")
        block_hash = str(block_hash_value) if block_hash_value else None
        block_height: int | None = None
        if confirmations > 0 and block_hash is not None:
            header = self.rpc.get_block_header(block_hash, verbose=True)
            if not isinstance(header, Mapping) or "height" not in header:
                raise RegtestServiceError(
                    "Bitcoin Core returned an invalid block header"
                )
            block_height = int(header["height"])

        return {
            "txid": txid,
            "status": "confirmed" if confirmations > 0 else "mempool",
            "confirmations": confirmations,
            "blockHash": block_hash,
            "blockHeight": block_height,
        }


__all__ = [
    "RegtestService",
    "RegtestServiceError",
    "WrongBitcoinNetworkError",
    "SATOSHIS_PER_BTC",
    "SUPPORTED_ADDRESS_TYPES",
    "btc_to_satoshi",
    "satoshi_to_btc",
]
