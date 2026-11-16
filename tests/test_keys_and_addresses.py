"""Deterministic key and Testnet address derivation tests."""

import pytest

from address.address import derive_all_addresses
from crypto.hashes import hash160
from crypto.keys import (
    SECP256K1_ORDER,
    generate_private_key,
    private_key_from_hex,
    private_key_to_hex,
    private_key_to_public_key,
)

_PRIVATE_KEY_HEX = "00" * 31 + "01"
_PUBLIC_KEY_HEX = (
    "0279be667ef9dcbbac55a06295ce870b0"
    "7029bfcdb2dce28d959f2815b16f81798"
)


def test_fixed_private_key_to_compressed_public_key() -> None:
    private_key = private_key_from_hex(_PRIVATE_KEY_HEX)
    public_key = private_key_to_public_key(private_key)

    assert len(public_key) == 33
    assert public_key.hex() == _PUBLIC_KEY_HEX
    assert hash160(public_key).hex() == "751e76e8199196d454941c45d1b3a323f1433bd6"


def test_private_key_hex_round_trip() -> None:
    private_key = private_key_from_hex(_PRIVATE_KEY_HEX)

    assert private_key_to_hex(private_key) == _PRIVATE_KEY_HEX


def test_generate_private_key_returns_valid_scalar() -> None:
    private_key = generate_private_key()
    private_key_int = int.from_bytes(private_key, byteorder="big")

    assert len(private_key) == 32
    assert 1 <= private_key_int < SECP256K1_ORDER


def test_fixed_private_key_to_p2pkh_testnet_address() -> None:
    addresses = derive_all_addresses(private_key_from_hex(_PRIVATE_KEY_HEX))

    assert addresses.p2pkh == "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r"


def test_fixed_private_key_to_p2wpkh_testnet_address() -> None:
    addresses = derive_all_addresses(private_key_from_hex(_PRIVATE_KEY_HEX))

    assert addresses.p2wpkh == "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"


def test_fixed_private_key_to_p2sh_p2wpkh_testnet_address() -> None:
    addresses = derive_all_addresses(private_key_from_hex(_PRIVATE_KEY_HEX))

    assert addresses.p2sh_p2wpkh == "2NAUYAHhujozruyzpsFRP63mbrdaU5wnEpN"


def test_fixed_private_key_to_p2tr_testnet_address() -> None:
    addresses = derive_all_addresses(private_key_from_hex(_PRIVATE_KEY_HEX))

    assert addresses.p2tr == "tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47zagq"


@pytest.mark.parametrize("private_key_int", [0, SECP256K1_ORDER])
def test_private_key_rejects_scalar_outside_curve_order(private_key_int: int) -> None:
    invalid_key = private_key_int.to_bytes(32, byteorder="big")

    with pytest.raises(ValueError, match="secp256k1 order"):
        private_key_to_public_key(invalid_key)


@pytest.mark.parametrize("value", ["01", "gg" * 32])
def test_private_key_from_hex_rejects_invalid_input(value: str) -> None:
    with pytest.raises(ValueError):
        private_key_from_hex(value)
