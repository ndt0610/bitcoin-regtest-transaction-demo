"""Tính SIGHASH_ALL legacy và BIP143 bằng ``python-bitcoinlib``."""

from __future__ import annotations

from bitcoin.core import CMutableTransaction
from bitcoin.core.script import (
    SIGHASH_ALL,
    SIGVERSION_BASE,
    SIGVERSION_WITNESS_V0,
    SignatureHash,
)

from transaction.models import P2PKH, UTXO
from transaction.script import p2pkh_script

__all__: list[str] = ["SIGHASH_ALL", "signature_hash_for_input"]


def signature_hash_for_input(
    transaction: CMutableTransaction,
    input_index: int,
    utxo: UTXO,
    public_key_hash: bytes,
) -> bytes:
    """Tính digest đúng cho một input legacy hoặc SegWit-v0."""
    if not isinstance(transaction, CMutableTransaction):
        raise TypeError("transaction must be a CMutableTransaction")
    if (
        not isinstance(input_index, int)
        or isinstance(input_index, bool)
        or not 0 <= input_index < len(transaction.vin)
    ):
        raise IndexError("input_index is out of range")

    script_code = p2pkh_script(public_key_hash)
    if utxo.address_type == P2PKH:
        return SignatureHash(
            script_code,
            transaction,
            input_index,
            SIGHASH_ALL,
            sigversion=SIGVERSION_BASE,
        )
    return SignatureHash(
        script_code,
        transaction,
        input_index,
        SIGHASH_ALL,
        amount=utxo.value_sat,
        sigversion=SIGVERSION_WITNESS_V0,
    )
