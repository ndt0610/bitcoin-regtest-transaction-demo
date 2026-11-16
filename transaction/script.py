"""Hàm hỗ trợ địa chỉ và script chi dựa trên ``python-bitcoinlib`` (P2PKH, P2SH-P2WPKH, P2WPKH, P2TR)."""

from __future__ import annotations

from typing import Final

from bitcoin.core.script import (
    CScript,
    OP_0,
    OP_1,
    OP_CHECKSIG,
    OP_DUP,
    OP_EQUAL,
    OP_EQUALVERIFY,
    OP_HASH160,
)

from address.address import SUPPORTED_NETWORKS
from address.base58 import base58check_decode
from address.bech32 import REGTEST_HRP, TESTNET_HRP, decode_segwit_address
from crypto.hashes import hash160
from transaction.models import P2PKH, P2SH_P2WPKH, P2TR, P2WPKH, normalize_address_type

_P2PKH_VERSION: Final[int] = 0x6F
_P2SH_VERSION: Final[int] = 0xC4

__all__: list[str] = [
    "p2pkh_script",
    "p2wpkh_script",
    "p2sh_script",
    "p2tr_script",
    "p2sh_p2wpkh_redeem_script",
    "address_to_script_pub_key",
    "script_pub_key_for_address",
    "script_pub_key_for_public_key",
]


def _network_hrp(network: str) -> str:
    if not isinstance(network, str):
        raise TypeError("network must be a string")
    normalized = network.lower()
    if normalized not in SUPPORTED_NETWORKS:
        raise ValueError("network must be 'testnet' or 'regtest'")
    return REGTEST_HRP if normalized == "regtest" else TESTNET_HRP


def _validate_hash160(value: bytes, name: str = "public_key_hash") -> None:
    if not isinstance(value, bytes):
        raise TypeError(f"{name} must be bytes")
    if len(value) != 20:
        raise ValueError(f"{name} must be exactly 20 bytes")


def p2pkh_script(public_key_hash: bytes) -> CScript:
    """Trả về script ``DUP HASH160 <key-hash> EQUALVERIFY CHECKSIG``."""
    _validate_hash160(public_key_hash)
    return CScript(
        [OP_DUP, OP_HASH160, public_key_hash, OP_EQUALVERIFY, OP_CHECKSIG]
    )


def p2wpkh_script(public_key_hash: bytes) -> CScript:
    """Trả về witness program SegWit-v0 ``0 <20-byte-key-hash>``."""
    _validate_hash160(public_key_hash)
    return CScript([OP_0, public_key_hash])


def p2tr_script(x_only_pubkey: bytes) -> CScript:
    """Trả về witness program Taproot SegWit-v1 ``1 <32-byte-x-only-pubkey>``."""
    if not isinstance(x_only_pubkey, bytes) or len(x_only_pubkey) != 32:
        raise ValueError("x_only_pubkey must be exactly 32 bytes")
    return CScript([OP_1, x_only_pubkey])


def p2sh_script(script_hash: bytes) -> CScript:
    """Trả về script ``HASH160 <script-hash> EQUAL``."""
    _validate_hash160(script_hash, "script_hash")
    return CScript([OP_HASH160, script_hash, OP_EQUAL])


def p2sh_p2wpkh_redeem_script(public_key_hash: bytes) -> CScript:
    """redeemScript SegWit lồng chính là witness program P2WPKH."""
    return p2wpkh_script(public_key_hash)


def address_to_script_pub_key(address: str, network: str = "regtest") -> CScript:
    """Giải mã địa chỉ ngoài Mainnet được hỗ trợ thành locking script."""
    if not isinstance(address, str) or not address:
        raise ValueError("address must be a non-empty string")
    hrp = _network_hrp(network)
    normalized_address = address.lower()
    if normalized_address.startswith((f"{TESTNET_HRP}1", f"{REGTEST_HRP}1")):
        version, witness_program = decode_segwit_address(hrp, address)
        if version == 0:
            return p2wpkh_script(witness_program)
        if version == 1:
            return p2tr_script(witness_program)
        raise ValueError(f"unsupported SegWit version: {version}")

    payload = base58check_decode(address)
    if len(payload) != 21:
        raise ValueError("Base58 address payload must contain 21 bytes")
    version, payload_hash = payload[0], payload[1:]
    if version == _P2PKH_VERSION:
        return p2pkh_script(payload_hash)
    if version == _P2SH_VERSION:
        return p2sh_script(payload_hash)
    raise ValueError("address is not a Testnet/Regtest P2PKH or P2SH address")


# Alias có tên giống field ``scriptPubKey`` của Bitcoin Core.
script_pub_key_for_address = address_to_script_pub_key


def script_pub_key_for_public_key(public_key: bytes, address_type: str) -> CScript:
    """Tạo locking script kỳ vọng cho khóa và loại địa chỉ được hỗ trợ."""
    if not isinstance(public_key, bytes):
        raise TypeError("public_key must be bytes")
    if len(public_key) != 33 or public_key[0] not in (0x02, 0x03):
        raise ValueError("public_key must be a compressed secp256k1 key")
    normalized_type = normalize_address_type(address_type)
    public_key_hash = hash160(public_key)
    if normalized_type == P2PKH:
        return p2pkh_script(public_key_hash)
    if normalized_type == P2WPKH:
        return p2wpkh_script(public_key_hash)
    if normalized_type == P2SH_P2WPKH:
        redeem_script = p2sh_p2wpkh_redeem_script(public_key_hash)
        return p2sh_script(hash160(bytes(redeem_script)))
    if normalized_type == P2TR:
        return p2tr_script(public_key[1:33])
    raise AssertionError("normalize_address_type returned an unknown type")
