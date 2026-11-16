"""Tuần tự hóa giao dịch và tạo identifier bằng ``python-bitcoinlib``."""

from __future__ import annotations

from bitcoin.core import CMutableTransaction, CTransaction, b2lx

BitcoinTransaction = CTransaction | CMutableTransaction

__all__: list[str] = [
    "BitcoinTransaction",
    "serialize_transaction",
    "transaction_identifiers",
    "transaction_sizes",
]


def serialize_transaction(transaction: BitcoinTransaction) -> str:
    """Tuần tự hóa toàn bộ giao dịch, gồm witness, thành hex viết thường."""
    if not isinstance(transaction, (CTransaction, CMutableTransaction)):
        raise TypeError("transaction must be a python-bitcoinlib transaction")
    return transaction.serialize().hex()


def transaction_identifiers(transaction: BitcoinTransaction) -> tuple[str, str]:
    """Trả về TXID và WTXID theo thứ tự hiển thị."""
    if not isinstance(transaction, (CTransaction, CMutableTransaction)):
        raise TypeError("transaction must be a python-bitcoinlib transaction")
    return b2lx(transaction.GetTxid()), b2lx(transaction.GetHash())


def transaction_sizes(transaction: BitcoinTransaction) -> tuple[int, int, int]:
    """Trả về kích thước byte, weight BIP141 và vSize."""
    if not isinstance(transaction, (CTransaction, CMutableTransaction)):
        raise TypeError("transaction must be a python-bitcoinlib transaction")
    serialized = transaction.serialize()
    stripped = transaction.serialize({"include_witness": False})
    size = len(serialized)
    weight = (len(stripped) * 4) + (size - len(stripped))
    vsize = (weight + 3) // 4
    return size, weight, vsize
