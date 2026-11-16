"""Focused tests for Regtest derivation, selection and real SDK signing."""

from __future__ import annotations

from bitcoin.core import CTransaction, b2lx
from ecdsa import SECP256k1, VerifyingKey
from ecdsa.util import sigdecode_der
import pytest

from address.address import derive_all_addresses
from crypto.keys import private_key_from_hex, private_key_to_public_key
from transaction.coin_selection import select_utxos
from transaction.models import InsufficientFundsError, UTXO
from transaction.script import script_pub_key_for_public_key
from transaction.signer import build_and_sign_transaction

_PRIVATE_KEY = private_key_from_hex("00" * 31 + "01")
_PUBLIC_KEY = private_key_to_public_key(_PRIVATE_KEY)
_ADDRESSES = derive_all_addresses(_PRIVATE_KEY, "regtest")
_RECIPIENT = derive_all_addresses(
    private_key_from_hex("00" * 31 + "02"),
    "regtest",
).p2wpkh


def _utxo(index: int, address_type: str, value_sat: int) -> UTXO:
    address = {
        "p2pkh": _ADDRESSES.p2pkh,
        "p2shP2wpkh": _ADDRESSES.p2sh_p2wpkh,
        "p2wpkh": _ADDRESSES.p2wpkh,
    }[address_type]
    return UTXO(
        txid=f"{index:064x}",
        vout=0,
        value_sat=value_sat,
        script_pub_key=bytes(
            script_pub_key_for_public_key(_PUBLIC_KEY, address_type)
        ).hex(),
        address=address,
        address_type=address_type,
        confirmations=1,
    )


def _preset_utxos() -> list[UTXO]:
    return [
        _utxo(1, "p2pkh", 50_000),
        _utxo(2, "p2shP2wpkh", 40_000),
        _utxo(3, "p2wpkh", 30_000),
    ]


def test_regtest_derivation_uses_bcrt_and_preserves_base58_prefixes() -> None:
    testnet = derive_all_addresses(_PRIVATE_KEY)
    regtest = derive_all_addresses(_PRIVATE_KEY, "regtest")

    assert regtest.p2wpkh == "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080"
    assert regtest.p2wpkh.startswith("bcrt1q")
    assert regtest.p2pkh == testnet.p2pkh
    assert regtest.p2sh_p2wpkh == testnet.p2sh_p2wpkh
    assert testnet.p2wpkh.startswith("tb1q")


def test_coin_selection_prioritizes_fewer_inputs() -> None:
    utxos = [
        _utxo(10, "p2wpkh", 100_000),
        _utxo(11, "p2wpkh", 55_000),
        _utxo(12, "p2wpkh", 50_000),
    ]

    selection = select_utxos(utxos, 90_000, 2)

    assert selection.selected_input_count == 1
    assert selection.selected_utxos[0].value_sat == 100_000


def test_coin_selection_uses_smallest_excess_for_same_input_count() -> None:
    utxos = [
        _utxo(20, "p2wpkh", 70_000),
        _utxo(21, "p2wpkh", 60_000),
    ]

    selection = select_utxos(utxos, 50_000, 1)

    assert selection.selected_input_count == 1
    assert selection.selected_utxos[0].value_sat == 60_000


def test_coin_selection_reports_insufficient_funds() -> None:
    with pytest.raises(InsufficientFundsError) as raised:
        select_utxos([_utxo(30, "p2wpkh", 10_000)], 10_000, 2)

    assert raised.value.available_sat == 10_000
    assert raised.value.required_sat > raised.value.available_sat


def test_dust_change_is_added_to_fee_instead_of_creating_output() -> None:
    selection = select_utxos(
        [_utxo(40, "p2wpkh", 10_000)],
        9_600,
        1,
    )

    assert not selection.creates_change
    assert selection.change_sat == 0
    assert selection.estimated_fee_sat == 400


def test_mixed_transaction_has_one_valid_signature_per_input() -> None:
    result = build_and_sign_transaction(
        _PRIVATE_KEY,
        _RECIPIENT,
        _preset_utxos(),
        100_000,
        2,
    )

    assert result["network"] == "regtest"
    assert result["selection"]["selectedInputCount"] == 3
    assert len(result["signatures"]) == 3
    assert [item["inputIndex"] for item in result["signatures"]] == [0, 1, 2]

    verifying_key = VerifyingKey.from_string(_PUBLIC_KEY, curve=SECP256k1)
    for item in result["signatures"]:
        signature_with_type = bytes.fromhex(item["signature"])
        assert signature_with_type[-1] == 1  # SIGHASH_ALL
        assert verifying_key.verify_digest(
            signature_with_type[:-1],
            bytes.fromhex(item["sighash"]),
            sigdecode=sigdecode_der,
        )


def test_mixed_transaction_encodes_each_address_type_differently() -> None:
    result = build_and_sign_transaction(
        _PRIVATE_KEY,
        _RECIPIENT,
        _preset_utxos(),
        100_000,
        2,
    )
    inputs = {
        item["addressType"]: item
        for item in result["signedTransaction"]["inputs"]
    }

    legacy_items = list(bytes.fromhex(inputs["p2pkh"]["scriptSig"]))
    assert inputs["p2pkh"]["scriptSig"]
    assert inputs["p2pkh"]["witness"] == []

    assert inputs["p2wpkh"]["scriptSig"] == ""
    assert len(inputs["p2wpkh"]["witness"]) == 2

    nested_script_sig = bytes.fromhex(inputs["p2shP2wpkh"]["scriptSig"])
    assert nested_script_sig[0] == 22
    assert nested_script_sig[1:3] == b"\x00\x14"
    assert len(inputs["p2shP2wpkh"]["witness"]) == 2

    # The first byte is a direct push of the DER signature, followed later by
    # the compressed public key push; checking it prevents placeholder strings.
    assert legacy_items[0] in (71, 72, 73)
    assert legacy_items[-34] == 33
    assert bytes(legacy_items[-33:]) == _PUBLIC_KEY


def test_transaction_serialization_ids_and_accounting_are_self_consistent() -> None:
    result = build_and_sign_transaction(
        _PRIVATE_KEY,
        _RECIPIENT,
        _preset_utxos(),
        100_000,
        2,
    )
    raw = bytes.fromhex(result["rawTransaction"])
    transaction = CTransaction.deserialize(raw)

    assert transaction.serialize() == raw
    assert b2lx(transaction.GetTxid()) == result["txid"]
    assert b2lx(transaction.GetHash()) == result["wtxid"]
    assert result["txid"] != result["wtxid"]
    assert result["size"] == len(raw)
    assert result["vsize"] <= result["selection"]["estimatedVSize"]
    assert result["totalInputSat"] == (
        result["totalOutputSat"] + result["feeSat"]
    )
    assert result["totalOutputSat"] == 100_000 + result["changeSat"]
    assert result["changeSat"] > 0


def test_signing_rejects_utxo_script_that_does_not_match_key() -> None:
    foreign_public_key = private_key_to_public_key(
        private_key_from_hex("00" * 31 + "03")
    )
    bad = _utxo(50, "p2wpkh", 20_000)
    bad = UTXO(
        txid=bad.txid,
        vout=bad.vout,
        value_sat=bad.value_sat,
        script_pub_key=bytes(
            script_pub_key_for_public_key(foreign_public_key, "p2wpkh")
        ).hex(),
        address=bad.address,
        address_type=bad.address_type,
    )

    with pytest.raises(ValueError, match="scriptPubKey"):
        build_and_sign_transaction(_PRIVATE_KEY, _RECIPIENT, [bad], 10_000, 1)
