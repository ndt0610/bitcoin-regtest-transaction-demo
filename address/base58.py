"""Mã hóa Base58 và Base58Check của Bitcoin, không dùng thư viện ví."""

from __future__ import annotations

import hmac
from typing import Final

from crypto.hashes import double_sha256

BASE58_ALPHABET: Final[str] = (
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
)
_BASE58_INDEX: Final[dict[str, int]] = {
    character: index for index, character in enumerate(BASE58_ALPHABET)
}
_CHECKSUM_LENGTH: Final[int] = 4

__all__: list[str] = [
    "BASE58_ALPHABET",
    "base58_encode",
    "base58_decode",
    "base58check_encode",
    "base58check_decode",
]


def _validate_bytes(data: bytes, name: str) -> None:
    if not isinstance(data, bytes):
        raise TypeError(f"{name} must be bytes")


def base58_encode(data: bytes) -> str:
    """Mã hóa bytes bằng bảng chữ cái Base58 của Bitcoin.

    Mỗi byte 0 ở đầu được biểu diễn bằng ``1`` ở đầu. Các byte còn lại được
    hiểu là một số nguyên big-endian và chuyển sang cơ số 58.
    """
    _validate_bytes(data, "data")
    leading_zero_count = len(data) - len(data.lstrip(b"\x00"))
    number = int.from_bytes(data, byteorder="big")
    encoded_characters: list[str] = []

    while number > 0:
        number, remainder = divmod(number, 58)
        encoded_characters.append(BASE58_ALPHABET[remainder])

    encoded_body = "".join(reversed(encoded_characters))
    return (BASE58_ALPHABET[0] * leading_zero_count) + encoded_body


def base58_decode(value: str) -> bytes:
    """Giải mã chuỗi Base58 Bitcoin và giữ nguyên mọi byte 0 ở đầu."""
    if not isinstance(value, str):
        raise TypeError("value must be a string")

    number = 0
    for character in value:
        try:
            digit = _BASE58_INDEX[character]
        except KeyError as exc:
            raise ValueError(f"invalid Base58 character: {character!r}") from exc
        number = (number * 58) + digit

    byte_length = (number.bit_length() + 7) // 8
    decoded_body = number.to_bytes(byte_length, byteorder="big") if number else b""
    leading_zero_count = len(value) - len(value.lstrip(BASE58_ALPHABET[0]))
    return (b"\x00" * leading_zero_count) + decoded_body


def base58check_encode(payload: bytes) -> str:
    """Mã hóa payload kèm checksum double-SHA256 dài bốn byte."""
    _validate_bytes(payload, "payload")
    checksum = double_sha256(payload)[:_CHECKSUM_LENGTH]
    return base58_encode(payload + checksum)


def base58check_decode(value: str) -> bytes:
    """Giải mã Base58Check và trả về payload sau khi kiểm tra checksum."""
    decoded = base58_decode(value)
    if len(decoded) < _CHECKSUM_LENGTH:
        raise ValueError("Base58Check value is too short to contain a checksum")

    payload = decoded[:-_CHECKSUM_LENGTH]
    checksum = decoded[-_CHECKSUM_LENGTH:]
    expected_checksum = double_sha256(payload)[:_CHECKSUM_LENGTH]
    if not hmac.compare_digest(checksum, expected_checksum):
        raise ValueError("invalid Base58Check checksum")
    return payload
