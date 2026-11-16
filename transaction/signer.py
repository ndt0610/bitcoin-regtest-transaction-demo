"""Tạo và ký độc lập giao dịch Bitcoin có nhiều loại địa chỉ."""

from __future__ import annotations

import hashlib
from decimal import Decimal
from typing import Any, Mapping, Sequence

from bitcoin.core import (
    CMutableTransaction,
    CMutableTxIn,
    CMutableTxOut,
    COutPoint,
    CScriptWitness,
    CTxInWitness,
    CTxWitness,
    b2lx,
    lx,
)
from bitcoin.core.script import CScript
from ecdsa import SECP256k1, SigningKey
from ecdsa.util import sigencode_der_canonize

from address.address import SUPPORTED_NETWORKS, derive_all_addresses
from crypto.hashes import hash160
from crypto.keys import private_key_from_hex, private_key_to_public_key
from transaction.coin_selection import (
    DEFAULT_DUST_THRESHOLD_SAT,
    coerce_utxos,
    select_utxos,
)
from transaction.models import P2PKH, P2SH_P2WPKH, P2TR, P2WPKH, UTXO
from transaction.script import (
    address_to_script_pub_key,
    p2sh_p2wpkh_redeem_script,
    script_pub_key_for_public_key,
)
from transaction.serializer import transaction_sizes
from transaction.sighash import SIGHASH_ALL, signature_hash_for_input

DEFAULT_SEQUENCE = 0xFFFFFFFD

__all__: list[str] = [
    "DEFAULT_SEQUENCE",
    "build_unsigned_transaction",
    "sign_transaction_inputs",
    "build_and_sign_transaction",
    "create_signed_transaction",
]


def _normalize_network(network: str) -> str:
    if not isinstance(network, str):
        raise TypeError("network must be a string")
    normalized = network.lower()
    if normalized not in SUPPORTED_NETWORKS:
        raise ValueError("network must be 'testnet' or 'regtest'")
    return normalized


def _normalize_private_key(private_key: bytes | str) -> bytes:
    if isinstance(private_key, str):
        return private_key_from_hex(private_key)
    if not isinstance(private_key, bytes):
        raise TypeError("private_key must be bytes or hexadecimal text")
    # Việc tạo khóa công khai thực hiện kiểm tra scalar chuẩn.
    private_key_to_public_key(private_key)
    return private_key


def _address_type(address: str, network: str) -> str:
    script = bytes(address_to_script_pub_key(address, network))
    if len(script) == 22 and script[:2] == b"\x00\x14":
        return P2WPKH
    if len(script) == 34 and script[:2] == b"\x51\x20":
        return P2TR
    if len(script) == 25 and script[:3] == b"\x76\xa9\x14":
        return P2PKH
    if len(script) == 23 and script[:2] == b"\xa9\x14":
        return P2SH_P2WPKH
    raise ValueError("unsupported recipient script")


def _validate_owned_utxos(
    utxos: Sequence[UTXO],
    private_key: bytes,
    network: str,
) -> None:
    public_key = private_key_to_public_key(private_key)
    addresses = derive_all_addresses(private_key, network)
    expected_addresses = {
        P2PKH: addresses.p2pkh,
        P2SH_P2WPKH: addresses.p2sh_p2wpkh,
        P2WPKH: addresses.p2wpkh,
        P2TR: addresses.p2tr,
    }
    for utxo in utxos:
        if utxo.address != expected_addresses[utxo.address_type]:
            raise ValueError(
                f"UTXO {utxo.txid}:{utxo.vout} does not belong to the supplied key"
            )
        expected_script = script_pub_key_for_public_key(
            public_key,
            utxo.address_type,
        )
        if bytes(expected_script).hex() != utxo.script_pub_key.lower():
            raise ValueError(
                f"UTXO {utxo.txid}:{utxo.vout} scriptPubKey does not match its address type"
            )


def build_unsigned_transaction(
    selected_utxos: Sequence[UTXO | Mapping[str, Any]],
    recipient_address: str,
    amount_sat: int,
    *,
    change_address: str | None = None,
    change_sat: int = 0,
    network: str = "regtest",
) -> CMutableTransaction:
    """Tạo giao dịch version 2 bằng cấu trúc giao dịch của SDK."""
    normalized_network = _normalize_network(network)
    normalized_utxos = coerce_utxos(selected_utxos)
    if not normalized_utxos:
        raise ValueError("selected_utxos must not be empty")
    if not isinstance(amount_sat, int) or isinstance(amount_sat, bool) or amount_sat <= 0:
        raise ValueError("amount_sat must be a positive integer")
    if not isinstance(change_sat, int) or isinstance(change_sat, bool) or change_sat < 0:
        raise ValueError("change_sat must be a non-negative integer")
    if change_sat and not change_address:
        raise ValueError("change_address is required when change_sat is positive")

    inputs = [
        CMutableTxIn(
            COutPoint(lx(utxo.txid), utxo.vout),
            nSequence=DEFAULT_SEQUENCE,
        )
        for utxo in normalized_utxos
    ]
    outputs = [
        CMutableTxOut(
            amount_sat,
            address_to_script_pub_key(recipient_address, normalized_network),
        )
    ]
    if change_sat:
        outputs.append(
            CMutableTxOut(
                change_sat,
                address_to_script_pub_key(change_address, normalized_network),
            )
        )
    return CMutableTransaction(
        vin=inputs,
        vout=outputs,
        nLockTime=0,
        nVersion=2,
    )


def sign_transaction_inputs(
    transaction: CMutableTransaction,
    selected_utxos: Sequence[UTXO | Mapping[str, Any]],
    private_key: bytes | str,
    *,
    network: str = "regtest",
) -> list[dict[str, Any]]:
    """Ký độc lập từng input và trả về một metadata item cho mỗi input."""
    normalized_network = _normalize_network(network)
    normalized_key = _normalize_private_key(private_key)
    normalized_utxos = coerce_utxos(selected_utxos)
    if len(transaction.vin) != len(normalized_utxos):
        raise ValueError("transaction input count must match selected UTXO count")
    _validate_owned_utxos(normalized_utxos, normalized_key, normalized_network)

    public_key = private_key_to_public_key(normalized_key)
    public_key_hash = hash160(public_key)
    # Wrapper khóa của python-bitcoinlib nạp động thư viện OpenSSL hệ thống,
    # thư viện này không có trong Python Windows chuẩn. Gói phụ thuộc ecdsa hiện
    # cung cấp chữ ký scalar tất định, low-S; các nguyên thủy
    # transaction/script/sighash/witness vẫn do SDK đảm nhiệm.
    signing_key = SigningKey.from_string(normalized_key, curve=SECP256k1)
    witnesses: list[CTxInWitness] = []
    signatures: list[dict[str, Any]] = []

    for input_index, utxo in enumerate(normalized_utxos):
        sighash = signature_hash_for_input(
            transaction,
            input_index,
            utxo,
            public_key_hash,
        )
        der_signature = signing_key.sign_digest_deterministic(
            sighash,
            hashfunc=hashlib.sha256,
            sigencode=sigencode_der_canonize,
        )
        signature = der_signature + bytes([SIGHASH_ALL])

        if utxo.address_type == P2PKH:
            script_sig = CScript([signature, public_key])
            witness_stack: tuple[bytes, ...] = ()
        elif utxo.address_type == P2WPKH:
            script_sig = CScript()
            witness_stack = (signature, public_key)
        elif utxo.address_type == P2SH_P2WPKH:
            redeem_script = p2sh_p2wpkh_redeem_script(public_key_hash)
            script_sig = CScript([bytes(redeem_script)])
            witness_stack = (signature, public_key)
        else:  # pragma: no cover - the UTXO model rejects this first.
            raise AssertionError("unknown normalized address type")

        transaction.vin[input_index].scriptSig = script_sig
        witnesses.append(CTxInWitness(CScriptWitness(witness_stack)))
        signatures.append(
            {
                "inputIndex": input_index,
                "addressType": utxo.address_type,
                "txid": utxo.txid,
                "vout": utxo.vout,
                "sighash": sighash.hex(),
                "signature": signature.hex(),
                "scriptSig": bytes(script_sig).hex(),
                "witness": [item.hex() for item in witness_stack],
            }
        )

    transaction.wit = CTxWitness(witnesses)
    return signatures


def _transaction_metadata(
    transaction: CMutableTransaction,
    selected_utxos: Sequence[UTXO],
    output_specs: Sequence[tuple[str, str, str]],
) -> dict[str, Any]:
    witness_items = transaction.wit.vtxinwit
    inputs: list[dict[str, Any]] = []
    for index, (txin, utxo) in enumerate(zip(transaction.vin, selected_utxos)):
        stack = ()
        if index < len(witness_items):
            stack = witness_items[index].scriptWitness.stack
        inputs.append(
            {
                "inputIndex": index,
                "txid": utxo.txid,
                "vout": utxo.vout,
                "valueSat": utxo.value_sat,
                "address": utxo.address,
                "addressType": utxo.address_type,
                "sequence": txin.nSequence,
                "scriptSig": bytes(txin.scriptSig).hex(),
                "witness": [item.hex() for item in stack],
            }
        )
    outputs = [
        {
            "outputIndex": index,
            "purpose": purpose,
            "address": address,
            "addressType": address_type,
            "valueSat": txout.nValue,
            "scriptPubKey": bytes(txout.scriptPubKey).hex(),
        }
        for index, (txout, (purpose, address, address_type)) in enumerate(
            zip(transaction.vout, output_specs)
        )
    ]
    return {
        "version": transaction.nVersion,
        "inputs": inputs,
        "outputs": outputs,
        "locktime": transaction.nLockTime,
    }


def build_and_sign_transaction(
    private_key: bytes | str,
    recipient_address: str,
    utxos: Sequence[UTXO | Mapping[str, Any]],
    amount_sat: int,
    fee_rate_sat_vb: int | Decimal,
    *,
    network: str = "regtest",
    dust_threshold_sat: int = DEFAULT_DUST_THRESHOLD_SAT,
) -> dict[str, Any]:
    """Chọn, tạo, ký và tuần tự hóa giao dịch có input hỗn hợp.

    Hàm này không gọi mạng và không phát giao dịch. Phần gọi hàm chịu trách
    nhiệm lấy UTXO và gửi ``rawTransaction`` trả về đến Core.
    """
    normalized_network = _normalize_network(network)
    normalized_key = _normalize_private_key(private_key)
    normalized_utxos = coerce_utxos(utxos)
    _validate_owned_utxos(normalized_utxos, normalized_key, normalized_network)

    recipient_script = address_to_script_pub_key(
        recipient_address,
        normalized_network,
    )
    addresses = derive_all_addresses(normalized_key, normalized_network)
    change_address = addresses.p2wpkh
    change_script = address_to_script_pub_key(change_address, normalized_network)
    selection = select_utxos(
        normalized_utxos,
        amount_sat,
        fee_rate_sat_vb,
        recipient_script_size=len(recipient_script),
        change_script_size=len(change_script),
        dust_threshold_sat=dust_threshold_sat,
    )

    transaction = build_unsigned_transaction(
        selection.selected_utxos,
        recipient_address,
        amount_sat,
        change_address=change_address,
        change_sat=selection.change_sat,
        network=normalized_network,
    )
    output_specs: list[tuple[str, str, str]] = [
        ("recipient", recipient_address, _address_type(recipient_address, normalized_network))
    ]
    if selection.change_sat:
        output_specs.append(("change", change_address, P2WPKH))
    unsigned_metadata = _transaction_metadata(
        transaction,
        selection.selected_utxos,
        output_specs,
    )

    signatures = sign_transaction_inputs(
        transaction,
        selection.selected_utxos,
        normalized_key,
        network=normalized_network,
    )
    raw_transaction = transaction.serialize().hex()
    size, weight, vsize = transaction_sizes(transaction)
    total_output_sat = sum(output.nValue for output in transaction.vout)
    fee_sat = selection.total_input_sat - total_output_sat
    if fee_sat < 0:
        raise AssertionError("transaction construction produced negative fee")
    if selection.total_input_sat != total_output_sat + fee_sat:
        raise AssertionError("transaction accounting invariant failed")

    return {
        "network": normalized_network,
        "selection": selection.to_dict(),
        "unsignedTransaction": unsigned_metadata,
        "signatures": signatures,
        "signedTransaction": _transaction_metadata(
            transaction,
            selection.selected_utxos,
            output_specs,
        ),
        "rawTransaction": raw_transaction,
        "txid": b2lx(transaction.GetTxid()),
        "wtxid": b2lx(transaction.GetHash()),
        "size": size,
        "weight": weight,
        "vsize": vsize,
        "totalInputSat": selection.total_input_sat,
        "totalOutputSat": total_output_sat,
        "feeSat": fee_sat,
        "changeSat": selection.change_sat,
    }


# Tên thay thế thuận tiện cho phần triển khai endpoint FastAPI.
create_signed_transaction = build_and_sign_transaction
