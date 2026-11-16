"""Kiểm tra khóa riêng tư Bitcoin và tạo khóa công khai nén."""

from __future__ import annotations

import secrets
from typing import Final

from ecdsa import SECP256k1, SigningKey

PRIVATE_KEY_SIZE: Final[int] = 32
SECP256K1_ORDER: Final[int] = (
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
)

__all__: list[str] = [
    "PRIVATE_KEY_SIZE",
    "SECP256K1_ORDER",
    "generate_private_key",
    "private_key_from_hex",
    "private_key_to_hex",
    "private_key_to_public_key",
]


def _private_key_as_int(private_key: bytes) -> int:
    """Kiểm tra scalar secp256k1 32 byte và trả về giá trị số nguyên."""
    if not isinstance(private_key, bytes):
        raise TypeError("private_key must be bytes")
    if len(private_key) != PRIVATE_KEY_SIZE:
        raise ValueError("private_key must be exactly 32 bytes")

    private_key_int = int.from_bytes(private_key, byteorder="big")
    if not 1 <= private_key_int < SECP256K1_ORDER:
        raise ValueError("private_key must satisfy 1 <= key < secp256k1 order")
    return private_key_int


def generate_private_key() -> bytes:
    """Tạo khóa riêng tư secp256k1 hợp lệ, phân bố đều, bằng ``secrets``."""
    private_key_int = secrets.randbelow(SECP256K1_ORDER - 1) + 1
    return private_key_int.to_bytes(PRIVATE_KEY_SIZE, byteorder="big")


def private_key_from_hex(value: str) -> bytes:
    """Phân tích khóa riêng tư hex 64 ký tự và kiểm tra scalar tương ứng."""
    if not isinstance(value, str):
        raise TypeError("value must be a string")
    if len(value) != PRIVATE_KEY_SIZE * 2:
        raise ValueError("private key hex must contain exactly 64 characters")

    try:
        private_key = bytes.fromhex(value)
    except ValueError as exc:
        raise ValueError("private key contains invalid hexadecimal characters") from exc

    _private_key_as_int(private_key)
    return private_key


def private_key_to_hex(private_key: bytes) -> str:
    """Kiểm tra và tuần tự hóa khóa riêng tư thành 64 ký tự hex viết thường."""
    _private_key_as_int(private_key)
    return private_key.hex()


def private_key_to_public_key(private_key: bytes) -> bytes:
    """Suy ra khóa công khai secp256k1 nén dài 33 byte.

    ``ecdsa`` thực hiện phép nhân trên đường cong elliptic. Dạng nén Bitcoin
    lưu X cùng tiền tố 0x02 khi Y chẵn hoặc 0x03 khi Y lẻ.
    """
    _private_key_as_int(private_key)
    signing_key = SigningKey.from_string(private_key, curve=SECP256k1)
    coordinates = signing_key.verifying_key.to_string()
    x_coordinate = coordinates[:32]
    y_coordinate = int.from_bytes(coordinates[32:], byteorder="big")
    prefix = b"\x02" if y_coordinate % 2 == 0 else b"\x03"
    return prefix + x_coordinate
