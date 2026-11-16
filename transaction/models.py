"""Các hợp đồng dữ liệu nhỏ dùng chung cho chọn UTXO và ký giao dịch."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Mapping, TypeAlias

AddressType: TypeAlias = str

P2PKH: Final[str] = "p2pkh"
P2WPKH: Final[str] = "p2wpkh"
P2SH_P2WPKH: Final[str] = "p2shP2wpkh"
P2TR: Final[str] = "p2tr"
SUPPORTED_ADDRESS_TYPES: Final[frozenset[str]] = frozenset(
    {P2PKH, P2WPKH, P2SH_P2WPKH, P2TR}
)

_ADDRESS_TYPE_ALIASES: Final[dict[str, str]] = {
    "p2pkh": P2PKH,
    "p2wpkh": P2WPKH,
    "p2shp2wpkh": P2SH_P2WPKH,
    "p2sh-p2wpkh": P2SH_P2WPKH,
    "p2sh_p2wpkh": P2SH_P2WPKH,
    "p2tr": P2TR,
    "taproot": P2TR,
}

__all__: list[str] = [
    "AddressType",
    "P2PKH",
    "P2WPKH",
    "P2SH_P2WPKH",
    "P2TR",
    "SUPPORTED_ADDRESS_TYPES",
    "normalize_address_type",
    "UTXO",
    "CoinSelectionResult",
    "InsufficientFundsError",
]


def normalize_address_type(value: str) -> str:
    """Chuẩn hóa cách viết từ UI/RPC theo contract camelCase công khai."""
    if not isinstance(value, str):
        raise TypeError("address_type must be a string")
    try:
        return _ADDRESS_TYPE_ALIASES[value.strip().lower()]
    except KeyError as exc:
        raise ValueError(f"unsupported address type: {value!r}") from exc


def _mapping_value(
    mapping: Mapping[str, Any],
    camel_name: str,
    snake_name: str,
    default: Any = None,
) -> Any:
    if camel_name in mapping:
        return mapping[camel_name]
    if snake_name in mapping:
        return mapping[snake_name]
    return default


@dataclass(frozen=True, slots=True)
class UTXO:
    """Output có thể chi do adapter Regtest ``scantxoutset`` trả về."""

    txid: str
    vout: int
    value_sat: int
    script_pub_key: str
    address: str
    address_type: str
    confirmations: int = 0
    block_height: int | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.txid, str) or len(self.txid) != 64:
            raise ValueError("txid must contain exactly 64 hexadecimal characters")
        try:
            bytes.fromhex(self.txid)
        except ValueError as exc:
            raise ValueError("txid contains invalid hexadecimal characters") from exc
        if not isinstance(self.vout, int) or isinstance(self.vout, bool) or self.vout < 0:
            raise ValueError("vout must be a non-negative integer")
        if (
            not isinstance(self.value_sat, int)
            or isinstance(self.value_sat, bool)
            or self.value_sat <= 0
        ):
            raise ValueError("value_sat must be a positive integer")
        if not isinstance(self.script_pub_key, str):
            raise TypeError("script_pub_key must be a hexadecimal string")
        try:
            bytes.fromhex(self.script_pub_key)
        except ValueError as exc:
            raise ValueError("script_pub_key contains invalid hexadecimal characters") from exc
        if not isinstance(self.address, str) or not self.address:
            raise ValueError("address must be a non-empty string")
        object.__setattr__(
            self,
            "address_type",
            normalize_address_type(self.address_type),
        )
        if (
            not isinstance(self.confirmations, int)
            or isinstance(self.confirmations, bool)
            or self.confirmations < 0
        ):
            raise ValueError("confirmations must be a non-negative integer")
        if self.block_height is not None and (
            not isinstance(self.block_height, int)
            or isinstance(self.block_height, bool)
            or self.block_height < 0
        ):
            raise ValueError("block_height must be a non-negative integer or None")

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> "UTXO":
        """Chấp nhận dữ liệu HTTP dạng camelCase hoặc Python dạng snake_case."""
        if not isinstance(value, Mapping):
            raise TypeError("UTXO must be a mapping or UTXO instance")
        return cls(
            txid=value.get("txid"),
            vout=value.get("vout"),
            value_sat=_mapping_value(value, "valueSat", "value_sat"),
            script_pub_key=_mapping_value(
                value,
                "scriptPubKey",
                "script_pub_key",
            ),
            address=value.get("address"),
            address_type=_mapping_value(
                value,
                "addressType",
                "address_type",
            ),
            confirmations=value.get("confirmations", 0),
            block_height=_mapping_value(
                value,
                "blockHeight",
                "block_height",
            ),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "txid": self.txid,
            "vout": self.vout,
            "valueSat": self.value_sat,
            "scriptPubKey": self.script_pub_key,
            "address": self.address,
            "addressType": self.address_type,
            "confirmations": self.confirmations,
            "blockHeight": self.block_height,
        }


@dataclass(frozen=True, slots=True)
class CoinSelectionResult:
    """Lựa chọn ít input nhất cùng phương án phí/tiền thừa thận trọng."""

    amount_sat: int
    required_sat: int
    selected_utxos: tuple[UTXO, ...]
    total_input_sat: int
    estimated_vsize: int
    estimated_fee_sat: int
    change_sat: int
    creates_change: bool

    @property
    def selected_input_count(self) -> int:
        return len(self.selected_utxos)

    def to_dict(self) -> dict[str, Any]:
        return {
            "requiredSat": self.required_sat,
            "selectedUtxos": [utxo.to_dict() for utxo in self.selected_utxos],
            "selectedInputCount": self.selected_input_count,
            "totalInputSat": self.total_input_sat,
            "estimatedVSize": self.estimated_vsize,
            "estimatedFeeSat": self.estimated_fee_sat,
            "changeSat": self.change_sat,
        }


class InsufficientFundsError(ValueError):
    """Lỗi khi toàn bộ UTXO khả dụng không đủ tiền gửi cộng phí tối thiểu."""

    def __init__(self, required_sat: int, available_sat: int) -> None:
        self.required_sat = required_sat
        self.available_sat = available_sat
        self.missing_sat = max(0, required_sat - available_sat)
        super().__init__(
            "insufficient funds: "
            f"required {required_sat} sat, available {available_sat} sat"
        )
