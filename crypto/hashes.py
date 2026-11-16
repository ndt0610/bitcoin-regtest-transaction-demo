"""Các hàm hash dùng cho địa chỉ Bitcoin và cấu trúc giao dịch."""

from __future__ import annotations

import hashlib

__all__: list[str] = ["sha256", "double_sha256", "ripemd160", "hash160"]


def _validate_bytes(data: bytes) -> None:
    """Yêu cầu bytes bất biến để hành vi hash luôn rõ ràng."""
    if not isinstance(data, bytes):
        raise TypeError("data must be bytes")


def sha256(data: bytes) -> bytes:
    """Trả về digest SHA-256 dài 32 byte của ``data``."""
    _validate_bytes(data)
    return hashlib.sha256(data).digest()


def double_sha256(data: bytes) -> bytes:
    """Trả về SHA256(SHA256(data)), được dùng trong checksum của Bitcoin."""
    _validate_bytes(data)
    return sha256(sha256(data))


def ripemd160(data: bytes) -> bytes:
    """Trả về digest RIPEMD-160 dài 20 byte của ``data``."""
    _validate_bytes(data)
    try:
        return hashlib.new("ripemd160", data).digest()
    except ValueError as exc:
        raise RuntimeError("RIPEMD-160 is unavailable in this Python build") from exc


def hash160(data: bytes) -> bytes:
    """Trả về RIPEMD160(SHA256(data)), thường gọi là HASH160 của Bitcoin."""
    _validate_bytes(data)
    return ripemd160(sha256(data))
