"""BIP173 tests for Bitcoin Testnet P2WPKH addresses."""

import pytest

from address.bech32 import (
    bech32_create_checksum,
    bech32_verify_checksum,
    convertbits,
    decode_segwit_address,
    encode_segwit_address,
)

_WITNESS_PROGRAM = bytes.fromhex("751e76e8199196d454941c45d1b3a323f1433bd6")
_P2WPKH_ADDRESS = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"


def test_bech32_checksum_primitives() -> None:
    data = [0] + convertbits(_WITNESS_PROGRAM, 8, 5)
    checksum = bech32_create_checksum("tb", data)

    assert len(checksum) == 6
    assert bech32_verify_checksum("tb", data + checksum)


def test_encode_and_decode_known_testnet_p2wpkh_vector() -> None:
    address = encode_segwit_address("tb", 0, _WITNESS_PROGRAM)

    assert address == _P2WPKH_ADDRESS
    assert decode_segwit_address("tb", address) == (0, _WITNESS_PROGRAM)


def test_decode_segwit_address_rejects_invalid_checksum() -> None:
    corrupted = _P2WPKH_ADDRESS[:-1] + "q"

    with pytest.raises(ValueError, match="checksum"):
        decode_segwit_address("tb", corrupted)


def test_decode_segwit_address_rejects_mixed_case() -> None:
    mixed_case = _P2WPKH_ADDRESS[:4].upper() + _P2WPKH_ADDRESS[4:]

    with pytest.raises(ValueError, match="mix"):
        decode_segwit_address("tb", mixed_case)
