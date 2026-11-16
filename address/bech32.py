"""Các nguyên thủy Bech32 (BIP173) và Bech32m (BIP350) cho SegWit v0 và Taproot v1 trên Testnet/Regtest."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Final

BECH32_ALPHABET: Final[str] = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
_BECH32_INDEX: Final[dict[str, int]] = {
    character: index for index, character in enumerate(BECH32_ALPHABET)
}
_GENERATOR: Final[tuple[int, ...]] = (
    0x3B6A57B2,
    0x26508E6D,
    0x1EA119FA,
    0x3D4233DD,
    0x2A1462B3,
)
BECH32_CHECKSUM_CONSTANT: Final[int] = 1
BECH32M_CHECKSUM_CONSTANT: Final[int] = 0x2BC830A3
_CHECKSUM_LENGTH: Final[int] = 6
_MAX_BECH32_LENGTH: Final[int] = 90
TESTNET_HRP: Final[str] = "tb"
REGTEST_HRP: Final[str] = "bcrt"
SUPPORTED_HRPS: Final[frozenset[str]] = frozenset({TESTNET_HRP, REGTEST_HRP})

__all__: list[str] = [
    "BECH32_ALPHABET",
    "TESTNET_HRP",
    "REGTEST_HRP",
    "SUPPORTED_HRPS",
    "BECH32_CHECKSUM_CONSTANT",
    "BECH32M_CHECKSUM_CONSTANT",
    "bech32_polymod",
    "bech32_hrp_expand",
    "bech32_create_checksum",
    "bech32_verify_checksum",
    "convertbits",
    "encode_segwit_address",
    "decode_segwit_address",
]


def _validate_five_bit_values(values: Sequence[int]) -> None:
    for value in values:
        if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= 31:
            raise ValueError("Bech32 data values must be integers from 0 to 31")


def _validate_hrp(hrp: str) -> None:
    if not isinstance(hrp, str):
        raise TypeError("hrp must be a string")
    if not hrp:
        raise ValueError("Bech32 HRP must not be empty")
    if any(ord(character) < 33 or ord(character) > 126 for character in hrp):
        raise ValueError("Bech32 HRP characters must be printable ASCII")


def bech32_polymod(values: Sequence[int]) -> int:
    """Tính đa thức checksum BIP173 / BIP350 trên các giá trị năm bit."""
    _validate_five_bit_values(values)
    checksum = 1
    for value in values:
        top = checksum >> 25
        checksum = ((checksum & 0x1FFFFFF) << 5) ^ value
        for index, generator in enumerate(_GENERATOR):
            if (top >> index) & 1:
                checksum ^= generator
    return checksum


def bech32_hrp_expand(hrp: str) -> list[int]:
    """Mở rộng phần dễ đọc theo đặc tả BIP173."""
    _validate_hrp(hrp)
    return (
        [ord(character) >> 5 for character in hrp]
        + [0]
        + [ord(character) & 31 for character in hrp]
    )


def bech32_create_checksum(hrp: str, data: Sequence[int], spec: int = BECH32_CHECKSUM_CONSTANT) -> list[int]:
    """Tạo sáu giá trị checksum năm bit được Bech32 / Bech32m sử dụng."""
    _validate_five_bit_values(data)
    values = bech32_hrp_expand(hrp) + list(data) + ([0] * _CHECKSUM_LENGTH)
    polymod = bech32_polymod(values) ^ spec
    return [
        (polymod >> (5 * (5 - index))) & 31
        for index in range(_CHECKSUM_LENGTH)
    ]


def bech32_verify_checksum(hrp: str, data: Sequence[int]) -> int | None:
    """Xác minh checksum và trả về loại spec (BECH32_CHECKSUM_CONSTANT hoặc BECH32M_CHECKSUM_CONSTANT) nếu hợp lệ."""
    _validate_five_bit_values(data)
    poly = bech32_polymod(bech32_hrp_expand(hrp) + list(data))
    if poly == BECH32_CHECKSUM_CONSTANT:
        return BECH32_CHECKSUM_CONSTANT
    if poly == BECH32M_CHECKSUM_CONSTANT:
        return BECH32M_CHECKSUM_CONSTANT
    return None


def convertbits(
    data: Iterable[int],
    from_bits: int,
    to_bits: int,
    pad: bool = True,
) -> list[int]:
    """Nhóm lại chuỗi giá trị giữa các độ rộng bit mà không đổi dữ liệu bit."""
    if not 1 <= from_bits <= 8 or not 1 <= to_bits <= 8:
        raise ValueError("from_bits and to_bits must be between 1 and 8")

    accumulator = 0
    accumulated_bits = 0
    result: list[int] = []
    max_output_value = (1 << to_bits) - 1
    max_accumulator = (1 << (from_bits + to_bits - 1)) - 1

    for value in data:
        if (
            not isinstance(value, int)
            or isinstance(value, bool)
            or value < 0
            or value >> from_bits
        ):
            raise ValueError(f"input value does not fit in {from_bits} bits")

        accumulator = (
            ((accumulator << from_bits) | value) & max_accumulator
        )
        accumulated_bits += from_bits
        while accumulated_bits >= to_bits:
            accumulated_bits -= to_bits
            result.append((accumulator >> accumulated_bits) & max_output_value)

    if pad:
        if accumulated_bits:
            result.append(
                (accumulator << (to_bits - accumulated_bits)) & max_output_value
            )
    elif accumulated_bits >= from_bits or (
        (accumulator << (to_bits - accumulated_bits)) & max_output_value
    ):
        raise ValueError("invalid padding in converted data")

    return result


def _bech32_encode(hrp: str, data: Sequence[int], spec: int = BECH32_CHECKSUM_CONSTANT) -> str:
    _validate_hrp(hrp)
    if hrp != hrp.lower():
        raise ValueError("Bech32 encoder requires a lowercase HRP")
    _validate_five_bit_values(data)

    combined = list(data) + bech32_create_checksum(hrp, data, spec=spec)
    encoded = hrp + "1" + "".join(BECH32_ALPHABET[value] for value in combined)
    if len(encoded) > _MAX_BECH32_LENGTH:
        raise ValueError("Bech32 value exceeds the 90-character limit")
    return encoded


def _bech32_decode(value: str) -> tuple[str, list[int], int]:
    if not isinstance(value, str):
        raise TypeError("address must be a string")
    if len(value) > _MAX_BECH32_LENGTH:
        raise ValueError("Bech32 value exceeds the 90-character limit")
    if any(ord(character) < 33 or ord(character) > 126 for character in value):
        raise ValueError("Bech32 value contains a non-printable ASCII character")
    if value.lower() != value and value.upper() != value:
        raise ValueError("Bech32 value must not mix uppercase and lowercase")

    normalized = value.lower()
    separator_position = normalized.rfind("1")
    if separator_position < 1 or separator_position + 7 > len(normalized):
        raise ValueError("Bech32 separator or checksum length is invalid")

    hrp = normalized[:separator_position]
    encoded_data = normalized[separator_position + 1 :]
    try:
        data = [_BECH32_INDEX[character] for character in encoded_data]
    except KeyError as exc:
        raise ValueError("Bech32 value contains an invalid data character") from exc

    spec = bech32_verify_checksum(hrp, data)
    if spec is None:
        raise ValueError("invalid Bech32/Bech32m checksum")
    return hrp, data[:-_CHECKSUM_LENGTH], spec


def encode_segwit_address(
    hrp: str,
    witness_version: int,
    witness_program: bytes,
) -> str:
    """Mã hóa witness program cho SegWit v0 (Bech32) hoặc Taproot v1 (Bech32m)."""
    if hrp not in SUPPORTED_HRPS:
        raise ValueError("only Bitcoin Testnet ('tb') and Regtest ('bcrt') are supported")
    if not (0 <= witness_version <= 16):
        raise ValueError("witness version must be between 0 and 16")
    if not isinstance(witness_program, bytes):
        raise TypeError("witness_program must be bytes")
    if witness_version == 0 and len(witness_program) not in (20, 32):
        raise ValueError("a SegWit v0 witness program must be 20 or 32 bytes")
    if witness_version == 1 and len(witness_program) != 32:
        raise ValueError("a Taproot v1 witness program must be exactly 32 bytes")

    spec = BECH32_CHECKSUM_CONSTANT if witness_version == 0 else BECH32M_CHECKSUM_CONSTANT
    data = [witness_version] + convertbits(witness_program, 8, 5, pad=True)
    return _bech32_encode(hrp, data, spec=spec)


def decode_segwit_address(hrp: str, address: str) -> tuple[int, bytes]:
    """Giải mã và kiểm tra địa chỉ SegWit v0 hoặc Taproot v1 trên Testnet/Regtest."""
    if hrp not in SUPPORTED_HRPS:
        raise ValueError("only Bitcoin Testnet ('tb') and Regtest ('bcrt') are supported")

    decoded_hrp, data, spec = _bech32_decode(address)
    if decoded_hrp != hrp:
        raise ValueError("Bech32 address HRP does not match the expected network")
    if not data:
        raise ValueError("SegWit address does not contain a witness version")

    witness_version = data[0]
    expected_spec = BECH32_CHECKSUM_CONSTANT if witness_version == 0 else BECH32M_CHECKSUM_CONSTANT
    if spec != expected_spec:
        raise ValueError(f"Checksum spec mismatch for witness version {witness_version}")

    witness_program = bytes(convertbits(data[1:], 5, 8, pad=False))
    if witness_version == 0 and len(witness_program) not in (20, 32):
        raise ValueError("a SegWit v0 witness program must be 20 or 32 bytes")
    if witness_version == 1 and len(witness_program) != 32:
        raise ValueError("a Taproot v1 witness program must be exactly 32 bytes")

    return witness_version, witness_program
