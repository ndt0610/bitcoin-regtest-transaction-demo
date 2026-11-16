"""Smoke tests proving that the planned package structure is importable."""

from importlib import import_module

import pytest


@pytest.mark.parametrize(
    "module_name",
    [
        "crypto.hashes",
        "crypto.keys",
        "crypto.signature",
        "address.base58",
        "address.bech32",
        "address.address",
        "transaction.models",
        "transaction.script",
        "transaction.serializer",
        "transaction.sighash",
        "transaction.coin_selection",
        "transaction.signer",
        "network.provider",
        "network.blockstream",
        "network.broadcast",
    ],
)
def test_planned_module_is_importable(module_name: str) -> None:
    assert import_module(module_name) is not None
