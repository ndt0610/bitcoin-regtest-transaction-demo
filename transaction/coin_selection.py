"""Bộ chọn coin vét cạn nhỏ, tối ưu cho số UTXO ít trong demo."""

from __future__ import annotations

from decimal import Decimal, ROUND_CEILING
from itertools import combinations
from typing import Any, Mapping, Sequence

from transaction.models import (
    CoinSelectionResult,
    InsufficientFundsError,
    P2PKH,
    P2SH_P2WPKH,
    P2TR,
    P2WPKH,
    UTXO,
)

DEFAULT_DUST_THRESHOLD_SAT = 294

# Dùng kích thước tối đa thận trọng. Chữ ký DER ECDSA có thể thay đổi một hoặc
# hai byte; dự phòng mức tối đa giúp mức phí thực tế không thấp hơn mục tiêu.
_BASE_INPUT_SIZE = {
    P2PKH: 149,
    P2WPKH: 41,
    P2SH_P2WPKH: 64,
    P2TR: 41,
}
_WITNESS_INPUT_SIZE = {
    P2PKH: 1,  # Witness rỗng khi một input khác kích hoạt serialization.
    P2WPKH: 109,
    P2SH_P2WPKH: 109,
    P2TR: 66,
}

__all__: list[str] = [
    "DEFAULT_DUST_THRESHOLD_SAT",
    "coerce_utxos",
    "estimate_transaction_vsize",
    "select_utxos",
]


def _varint_size(value: int) -> int:
    if value < 0:
        raise ValueError("VarInt value must not be negative")
    if value < 0xFD:
        return 1
    if value <= 0xFFFF:
        return 3
    if value <= 0xFFFFFFFF:
        return 5
    return 9


def _normalize_fee_rate(value: int | Decimal) -> Decimal:
    if isinstance(value, bool) or isinstance(value, float):
        raise TypeError("fee_rate_sat_vb must be an int or Decimal, never float")
    if isinstance(value, int):
        rate = Decimal(value)
    elif isinstance(value, Decimal):
        rate = value
    else:
        raise TypeError("fee_rate_sat_vb must be an int or Decimal")
    if not rate.is_finite() or rate <= 0:
        raise ValueError("fee_rate_sat_vb must be positive and finite")
    return rate


def _fee_for_vsize(vsize: int, fee_rate_sat_vb: Decimal) -> int:
    return int((Decimal(vsize) * fee_rate_sat_vb).to_integral_value(rounding=ROUND_CEILING))


def coerce_utxos(values: Sequence[UTXO | Mapping[str, Any]]) -> tuple[UTXO, ...]:
    """Chuẩn hóa dictionary HTTP nhưng vẫn giữ model nội bộ có kiểu."""
    if isinstance(values, (str, bytes)) or not isinstance(values, Sequence):
        raise TypeError("utxos must be a sequence")
    result = tuple(
        value if isinstance(value, UTXO) else UTXO.from_mapping(value)
        for value in values
    )
    outpoints = {(utxo.txid, utxo.vout) for utxo in result}
    if len(outpoints) != len(result):
        raise ValueError("utxos contains a duplicate outpoint")
    return result


def estimate_transaction_vsize(
    utxos: Sequence[UTXO | Mapping[str, Any]],
    output_script_sizes: Sequence[int] = (22, 22),
) -> int:
    """Ước tính thận trọng vSize của giao dịch legacy/SegWit hỗn hợp."""
    normalized = coerce_utxos(utxos)
    if not normalized:
        raise ValueError("at least one UTXO is required")
    if not output_script_sizes:
        raise ValueError("at least one output is required")
    if any(
        not isinstance(size, int) or isinstance(size, bool) or size < 0
        for size in output_script_sizes
    ):
        raise ValueError("output script sizes must be non-negative integers")

    stripped_size = (
        4
        + _varint_size(len(normalized))
        + sum(_BASE_INPUT_SIZE[utxo.address_type] for utxo in normalized)
        + _varint_size(len(output_script_sizes))
        + sum(8 + _varint_size(size) + size for size in output_script_sizes)
        + 4
    )
    has_witness = any(utxo.address_type != P2PKH for utxo in normalized)
    witness_size = 0
    if has_witness:
        witness_size = 2 + sum(
            _WITNESS_INPUT_SIZE[utxo.address_type] for utxo in normalized
        )
    weight = (stripped_size * 4) + witness_size
    return (weight + 3) // 4


def select_utxos(
    utxos: Sequence[UTXO | Mapping[str, Any]],
    amount_sat: int,
    fee_rate_sat_vb: int | Decimal,
    *,
    recipient_script_size: int = 22,
    change_script_size: int = 22,
    dust_threshold_sat: int = DEFAULT_DUST_THRESHOLD_SAT,
) -> CoinSelectionResult:
    """Chọn ít input nhất, sau đó chọn phương án có phần dư nhỏ nhất.

    Việc duyệt toàn bộ tổ hợp là có chủ đích: demo học tập chỉ quản lý ít output,
    giúp chính sách lựa chọn minh bạch và tất định.

    Lưu ý: P2TR UTXO bị loại trừ khỏi coin selection vì ký Taproot yêu cầu
    Schnorr/BIP341 — khác với ECDSA dùng cho P2PKH/P2WPKH/P2SH-P2WPKH.
    P2TR vẫn hiển thị trong bảng UTXO nhưng không dùng làm input.
    """
    all_normalized = coerce_utxos(utxos)
    # Lọc P2TR ra: ký Taproot cần Schnorr (BIP340/341), không phải ECDSA.
    normalized = tuple(u for u in all_normalized if u.address_type != P2TR)
    if not isinstance(amount_sat, int) or isinstance(amount_sat, bool) or amount_sat <= 0:
        raise ValueError("amount_sat must be a positive integer")
    if (
        not isinstance(dust_threshold_sat, int)
        or isinstance(dust_threshold_sat, bool)
        or dust_threshold_sat < 0
    ):
        raise ValueError("dust_threshold_sat must be a non-negative integer")
    for name, size in (
        ("recipient_script_size", recipient_script_size),
        ("change_script_size", change_script_size),
    ):
        if not isinstance(size, int) or isinstance(size, bool) or size < 0:
            raise ValueError(f"{name} must be a non-negative integer")
    fee_rate = _normalize_fee_rate(fee_rate_sat_vb)

    for input_count in range(1, len(normalized) + 1):
        candidates: list[tuple[tuple[Any, ...], CoinSelectionResult]] = []
        for candidate in combinations(normalized, input_count):
            total_input = sum(utxo.value_sat for utxo in candidate)
            no_change_vsize = estimate_transaction_vsize(
                candidate,
                (recipient_script_size,),
            )
            minimum_fee = _fee_for_vsize(no_change_vsize, fee_rate)
            if total_input < amount_sat + minimum_fee:
                continue

            with_change_vsize = estimate_transaction_vsize(
                candidate,
                (recipient_script_size, change_script_size),
            )
            with_change_fee = _fee_for_vsize(with_change_vsize, fee_rate)
            prospective_change = total_input - amount_sat - with_change_fee
            if prospective_change >= dust_threshold_sat:
                estimated_vsize = with_change_vsize
                fee_sat = with_change_fee
                change_sat = prospective_change
                creates_change = True
            else:
                # Phần dư không trả lại được cộng có chủ đích vào phí.
                estimated_vsize = no_change_vsize
                fee_sat = total_input - amount_sat
                change_sat = 0
                creates_change = False

            result = CoinSelectionResult(
                amount_sat=amount_sat,
                required_sat=amount_sat + fee_sat,
                selected_utxos=tuple(candidate),
                total_input_sat=total_input,
                estimated_vsize=estimated_vsize,
                estimated_fee_sat=fee_sat,
                change_sat=change_sat,
                creates_change=creates_change,
            )
            # "Phần dư" được đo so với dạng tối thiểu để relay, tránh việc các
            # phương án chuyển dust vào phí bị coi là hòa một cách giả tạo.
            excess = total_input - amount_sat - minimum_fee
            tie_break = tuple((utxo.txid, utxo.vout) for utxo in candidate)
            candidates.append(((excess, total_input, tie_break), result))

        if candidates:
            return min(candidates, key=lambda item: item[0])[1]

    available_sat = sum(utxo.value_sat for utxo in normalized)
    if normalized:
        final_vsize = estimate_transaction_vsize(
            normalized,
            (recipient_script_size,),
        )
        required_sat = amount_sat + _fee_for_vsize(final_vsize, fee_rate)
    else:
        required_sat = amount_sat
    raise InsufficientFundsError(required_sat, available_sat)
