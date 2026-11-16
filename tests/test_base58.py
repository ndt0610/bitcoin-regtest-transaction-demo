"""Tests for raw Base58 and checksummed Base58Check."""

import pytest

from address.base58 import (
    base58_decode,
    base58_encode,
    base58check_decode,
    base58check_encode,
)

_TESTNET_P2PKH_PAYLOAD = bytes.fromhex(
    "6f751e76e8199196d454941c45d1b3a323f1433bd6"
)
_TESTNET_P2PKH_ADDRESS = "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r"


@pytest.mark.parametrize(
    "raw_value",
    [b"", b"\x01", b"Bitcoin", bytes.fromhex("ff00aa")],
)
def test_base58_encode_decode_round_trip(raw_value: bytes) -> None:
    assert base58_decode(base58_encode(raw_value)) == raw_value


def test_base58_preserves_leading_zero_bytes() -> None:
    raw_value = b"\x00\x00\x01"

    assert base58_encode(raw_value) == "112"
    assert base58_decode("112") == raw_value


def test_base58check_known_vector_and_round_trip() -> None:
    encoded = base58check_encode(_TESTNET_P2PKH_PAYLOAD)

    assert encoded == _TESTNET_P2PKH_ADDRESS
    assert base58check_decode(encoded) == _TESTNET_P2PKH_PAYLOAD


def test_base58check_rejects_invalid_checksum() -> None:
    corrupted = _TESTNET_P2PKH_ADDRESS[:-1] + "s"

    with pytest.raises(ValueError, match="checksum"):
        base58check_decode(corrupted)
