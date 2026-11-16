"""Tạo địa chỉ Testnet hoặc Regtest từ khóa secp256k1 nén (P2PKH, P2SH-P2WPKH, P2WPKH, P2TR)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from address.base58 import base58check_encode
from address.bech32 import REGTEST_HRP, TESTNET_HRP, encode_segwit_address
from crypto.hashes import hash160
from crypto.keys import private_key_to_public_key

TESTNET_P2PKH_VERSION: Final[bytes] = b"\x6f"
TESTNET_P2SH_VERSION: Final[bytes] = b"\xc4"
REGTEST_P2PKH_VERSION: Final[bytes] = TESTNET_P2PKH_VERSION
REGTEST_P2SH_VERSION: Final[bytes] = TESTNET_P2SH_VERSION
SUPPORTED_NETWORKS: Final[frozenset[str]] = frozenset({"testnet", "regtest"})

__all__: list[str] = [
    "DerivedAddresses",
    "SUPPORTED_NETWORKS",
    "public_key_to_p2pkh_address",
    "public_key_to_p2wpkh_address",
    "public_key_to_p2sh_p2wpkh_address",
    "public_key_to_p2tr_address",
    "derive_all_addresses",
]


@dataclass(frozen=True, slots=True)
class DerivedAddresses:
    """Các dạng địa chỉ Bitcoin được hỗ trợ, tạo từ cùng một khóa công khai."""

    p2pkh: str
    p2sh_p2wpkh: str
    p2wpkh: str
    p2tr: str = ""


def _validate_compressed_public_key(public_key: bytes) -> None:
    if not isinstance(public_key, bytes):
        raise TypeError("public_key must be bytes")
    if len(public_key) != 33 or public_key[0] not in (0x02, 0x03):
        raise ValueError("public_key must be a 33-byte compressed public key")


def _normalize_network(network: str) -> str:
    """Trả về tên mạng viết thường được hỗ trợ, không bật Mainnet."""
    if not isinstance(network, str):
        raise TypeError("network must be a string")
    normalized = network.lower()
    if normalized not in SUPPORTED_NETWORKS:
        raise ValueError("network must be 'testnet' or 'regtest'")
    return normalized


def public_key_to_p2pkh_address(
    public_key: bytes,
    network: str = "testnet",
) -> str:
    """Tạo địa chỉ P2PKH legacy ngoài Mainnet (version byte ``0x6f``)."""
    _validate_compressed_public_key(public_key)
    _normalize_network(network)
    public_key_hash = hash160(public_key)
    return base58check_encode(TESTNET_P2PKH_VERSION + public_key_hash)


def public_key_to_p2wpkh_address(
    public_key: bytes,
    network: str = "testnet",
) -> str:
    """Tạo địa chỉ P2WPKH SegWit v0 native cho mạng ngoài Mainnet."""
    _validate_compressed_public_key(public_key)
    normalized_network = _normalize_network(network)
    public_key_hash = hash160(public_key)
    hrp = REGTEST_HRP if normalized_network == "regtest" else TESTNET_HRP
    return encode_segwit_address(hrp, 0, public_key_hash)


def public_key_to_p2sh_p2wpkh_address(
    public_key: bytes,
    network: str = "testnet",
) -> str:
    """Tạo địa chỉ P2SH-P2WPKH SegWit lồng cho mạng ngoài Mainnet."""
    _validate_compressed_public_key(public_key)
    _normalize_network(network)
    public_key_hash = hash160(public_key)

    # redeemScript gồm OP_0, sau đó là direct push của hash 20 byte.
    redeem_script = b"\x00\x14" + public_key_hash
    script_hash = hash160(redeem_script)
    return base58check_encode(TESTNET_P2SH_VERSION + script_hash)


def public_key_to_p2tr_address(
    public_key: bytes,
    network: str = "testnet",
) -> str:
    """Tạo địa chỉ Taproot P2TR SegWit v1 (BIP86) cho mạng ngoài Mainnet."""
    _validate_compressed_public_key(public_key)
    normalized_network = _normalize_network(network)
    hrp = REGTEST_HRP if normalized_network == "regtest" else TESTNET_HRP
    x_only_pubkey = public_key[1:33]
    return encode_segwit_address(hrp, 1, x_only_pubkey)


def derive_all_addresses(
    private_key: bytes,
    network: str = "testnet",
) -> DerivedAddresses:
    """Tạo toàn bộ địa chỉ được hỗ trợ (P2PKH, P2SH-P2WPKH, P2WPKH, P2TR)."""
    normalized_network = _normalize_network(network)
    public_key = private_key_to_public_key(private_key)
    return DerivedAddresses(
        p2pkh=public_key_to_p2pkh_address(public_key, normalized_network),
        p2sh_p2wpkh=public_key_to_p2sh_p2wpkh_address(
            public_key,
            normalized_network,
        ),
        p2wpkh=public_key_to_p2wpkh_address(public_key, normalized_network),
        p2tr=public_key_to_p2tr_address(public_key, normalized_network),
    )
