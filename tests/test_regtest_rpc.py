"""Unit tests for the local Bitcoin Core RPC and Regtest service layers."""

from __future__ import annotations

from decimal import Decimal
import json
from typing import Any

import httpx
import pytest

from network.bitcoin_rpc import (
    BitcoinRPCClient,
    BitcoinRPCConfigurationError,
    BitcoinRPCError,
    load_bitcoin_rpc_settings,
)
from network.regtest import (
    RegtestService,
    WrongBitcoinNetworkError,
    btc_to_satoshi,
    satoshi_to_btc,
)


class FakeRPC:
    """Small stateful Core double; no test in this file needs a live node."""

    wallet_name = "demo_miner"

    def __init__(self, *, chain: str = "regtest", wallet_loaded: bool = True) -> None:
        self.chain = chain
        self.wallet_loaded = wallet_loaded
        self.wallet_exists = wallet_loaded
        self.block_count = 101
        self.balance = Decimal("50") if wallet_loaded else Decimal("0")
        self.labels: dict[str, str] = {}
        self.generated: list[tuple[int, str]] = []
        self.sent: list[tuple[str, Decimal, str | None]] = []
        self.scans: list[tuple[str, list[str]]] = []
        self.raw_transactions: dict[str, dict[str, Any]] = {}
        self.broadcast_raw: str | None = None

    def get_blockchain_info(self) -> dict[str, Any]:
        return {"chain": self.chain, "blocks": self.block_count}

    def get_block_count(self) -> int:
        return self.block_count

    def list_wallets(self) -> list[str]:
        return [self.wallet_name] if self.wallet_loaded else []

    def list_wallet_dir(self) -> dict[str, Any]:
        wallets = [{"name": self.wallet_name}] if self.wallet_exists else []
        return {"wallets": wallets}

    def create_wallet(self, wallet_name: str) -> dict[str, str]:
        assert wallet_name == self.wallet_name
        self.wallet_exists = True
        self.wallet_loaded = True
        return {"name": wallet_name}

    def load_wallet(self, wallet_name: str) -> dict[str, str]:
        assert wallet_name == self.wallet_name
        self.wallet_loaded = True
        return {"name": wallet_name}

    def get_addresses_by_label(
        self,
        label: str,
        *,
        wallet_name: str | None = None,
    ) -> dict[str, Any]:
        assert wallet_name == self.wallet_name
        if label not in self.labels:
            raise BitcoinRPCError("getaddressesbylabel", -11, "No addresses")
        return {self.labels[label]: {"purpose": "receive"}}

    def get_new_address(
        self,
        *,
        label: str,
        address_type: str,
        wallet_name: str | None = None,
    ) -> str:
        assert wallet_name == self.wallet_name
        assert address_type == "bech32"
        address = f"bcrt1q{len(self.labels) + 1:038d}"
        self.labels[label] = address
        return address

    def get_balance(self, *, wallet_name: str | None = None) -> Decimal:
        assert wallet_name == self.wallet_name
        return self.balance

    def generate_to_address(self, blocks: int, address: str) -> list[str]:
        self.generated.append((blocks, address))
        self.block_count += blocks
        if blocks >= 101:
            self.balance = Decimal("50")
        return [f"block-{index}" for index in range(blocks)]

    def send_to_address(
        self,
        address: str,
        amount_btc: Decimal,
        *,
        wallet_name: str | None = None,
    ) -> str:
        self.sent.append((address, amount_btc, wallet_name))
        txid = f"{len(self.sent):064x}"
        self.raw_transactions[txid] = {"confirmations": 1}
        return txid

    def get_raw_transaction(self, txid: str, *, verbose: bool = True) -> Any:
        assert verbose is True
        return self.raw_transactions[txid]

    def scan_tx_out_set(self, action: str, scan_objects: list[str]) -> dict[str, Any]:
        self.scans.append((action, scan_objects))
        index = len(self.scans)
        return {
            "success": True,
            "unspents": [
                {
                    "txid": f"{index:064x}",
                    "vout": index - 1,
                    "scriptPubKey": "0014" + "11" * 20,
                    "amount": Decimal("0.00050000"),
                    "height": 100,
                }
            ],
        }

    def send_raw_transaction(self, raw_transaction: str) -> str:
        self.broadcast_raw = raw_transaction
        return "ab" * 32

    def get_block_header(self, block_hash: str, *, verbose: bool = True) -> Any:
        assert block_hash == "cd" * 32
        assert verbose is True
        return {"height": 103}


def test_rpc_settings_are_environment_driven_and_require_password() -> None:
    with pytest.raises(BitcoinRPCConfigurationError, match="BITCOIN_RPC_USER"):
        load_bitcoin_rpc_settings({})

    settings = load_bitcoin_rpc_settings(
        {
            "BITCOIN_RPC_URL": "http://127.0.0.1:18443/",
            "BITCOIN_RPC_USER": "bitcoin_demo",
            "BITCOIN_RPC_PASSWORD": "local-only-secret",
            "BITCOIN_RPC_WALLET": "miner wallet",
            "BITCOIN_RPC_TIMEOUT_SECONDS": "7",
        }
    )

    assert settings.url == "http://127.0.0.1:18443"
    assert settings.wallet == "miner wallet"
    assert settings.timeout_seconds == 7
    assert "local-only-secret" not in repr(settings)


def test_rpc_routes_node_and_wallet_calls_and_preserves_decimal_json() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        body = json.loads(request.content)
        if body["method"] == "getblockcount":
            return httpx.Response(200, content=b'{"result":101,"error":null,"id":1}')
        return httpx.Response(
            200,
            content=b'{"result":"' + b"12" * 32 + b'","error":null,"id":2}',
        )

    client = BitcoinRPCClient(
        "http://127.0.0.1:18443",
        "bitcoin_demo",
        "secret",
        wallet_name="miner wallet",
        transport=httpx.MockTransport(handler),
    )
    try:
        assert client.get_block_count() == 101
        client.send_to_address("bcrt1qdestination", Decimal("0.00050000"))
    finally:
        client.close()

    assert requests[0].url.raw_path == b"/"
    assert requests[1].url.raw_path == b"/wallet/miner%20wallet"
    assert b'"params":["bcrt1qdestination",0.00050000]' in requests[1].content
    assert requests[1].headers["authorization"].startswith("Basic ")


def test_rpc_error_redacts_credentials() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            500,
            json={
                "result": None,
                "error": {
                    "code": -1,
                    "message": "secret bitcoin_demo http://127.0.0.1:18443",
                },
                "id": 1,
            },
        )

    client = BitcoinRPCClient(
        "http://127.0.0.1:18443",
        "bitcoin_demo",
        "secret",
        transport=httpx.MockTransport(handler),
    )
    try:
        with pytest.raises(BitcoinRPCError) as caught:
            client.get_block_count()
    finally:
        client.close()

    rendered = str(caught.value)
    assert "secret" not in rendered
    assert "bitcoin_demo" not in rendered
    assert "http://127.0.0.1:18443" not in rendered
    assert caught.value.code == -1


@pytest.mark.parametrize(
    ("satoshis", "btc"),
    [
        (0, Decimal("0")),
        (1, Decimal("0.00000001")),
        (50_000, Decimal("0.0005")),
        (5_000_000_000, Decimal("50")),
    ],
)
def test_satoshi_btc_decimal_round_trip(satoshis: int, btc: Decimal) -> None:
    assert satoshi_to_btc(satoshis) == btc
    assert btc_to_satoshi(btc) == satoshis


def test_btc_conversion_rejects_float_and_sub_satoshi_values() -> None:
    with pytest.raises(TypeError, match="Decimal"):
        btc_to_satoshi(0.1)
    with pytest.raises(ValueError, match="eight decimal"):
        btc_to_satoshi(Decimal("0.000000001"))


def test_status_uses_real_chain_and_wallet_data() -> None:
    rpc = FakeRPC()
    result = RegtestService(rpc).status()  # type: ignore[arg-type]

    assert result == {
        "online": True,
        "chain": "regtest",
        "blocks": 101,
        "wallet": "demo_miner",
        "walletLoaded": True,
        "minerBalanceSat": 5_000_000_000,
    }


def test_status_rejects_any_chain_other_than_regtest() -> None:
    service = RegtestService(FakeRPC(chain="test"))  # type: ignore[arg-type]

    with pytest.raises(WrongBitcoinNetworkError, match="test"):
        service.status()


def test_initialize_creates_wallet_and_bootstraps_only_once() -> None:
    rpc = FakeRPC(wallet_loaded=False)
    rpc.wallet_exists = False
    rpc.block_count = 0
    service = RegtestService(rpc)  # type: ignore[arg-type]

    initialized = service.initialize(bootstrap=True)
    initialized_again = service.initialize(bootstrap=True)

    assert initialized["walletAction"] == "created"
    assert initialized["blocksMined"] == 101
    assert initialized["blockHeight"] == 101
    assert initialized["balanceSat"] == 5_000_000_000
    assert initialized["minerAddress"].startswith("bcrt1q")
    assert initialized["demoRecipientAddress"].startswith("bcrt1q")
    assert initialized_again["blocksMined"] == 0
    assert rpc.generated == [(101, initialized["minerAddress"])]


def test_faucet_sends_exact_decimal_amounts_and_confirms() -> None:
    rpc = FakeRPC()
    service = RegtestService(rpc)  # type: ignore[arg-type]
    addresses = {
        "p2pkh": "mwJn",
        "p2shP2wpkh": "2Nabc",
        "p2wpkh": "bcrt1qabc",
    }
    amounts = {"p2pkh": 50_000, "p2shP2wpkh": 40_000, "p2wpkh": 30_000}

    result = service.faucet(addresses, amounts, mine_confirmation=True)

    assert [sent[1] for sent in rpc.sent] == [
        Decimal("0.0005"),
        Decimal("0.0004"),
        Decimal("0.0003"),
    ]
    assert all(sent[2] == "demo_miner" for sent in rpc.sent)
    assert result["blocksMined"] == 1
    assert result["confirmations"] == {
        "p2pkh": 1,
        "p2shP2wpkh": 1,
        "p2wpkh": 1,
    }
    assert len(result["fundingTxids"]) == 3


def test_scantxoutset_utxos_include_type_script_value_and_confirmations() -> None:
    rpc = FakeRPC()
    service = RegtestService(rpc)  # type: ignore[arg-type]
    addresses = {
        "p2pkh": "mwJn",
        "p2shP2wpkh": "2Nabc",
        "p2wpkh": "bcrt1qabc",
    }

    utxos = service.fetch_utxos(addresses)

    assert len(utxos) == 3
    assert {utxo["addressType"] for utxo in utxos} == set(addresses)
    assert all(utxo["valueSat"] == 50_000 for utxo in utxos)
    assert all(utxo["confirmations"] == 2 for utxo in utxos)
    assert all(utxo["scriptPubKey"].startswith("0014") for utxo in utxos)
    assert rpc.scans == [
        ("start", ["addr(mwJn)"]),
        ("start", ["addr(2Nabc)"]),
        ("start", ["addr(bcrt1qabc)"]),
    ]


def test_broadcast_and_transaction_status_use_node_rpc() -> None:
    rpc = FakeRPC()
    service = RegtestService(rpc)  # type: ignore[arg-type]
    txid = "ef" * 32
    rpc.raw_transactions[txid] = {
        "confirmations": 1,
        "blockhash": "cd" * 32,
    }

    assert service.broadcast("00ff") == {"txid": "ab" * 32}
    assert rpc.broadcast_raw == "00ff"
    assert service.transaction_status(txid) == {
        "txid": txid,
        "status": "confirmed",
        "confirmations": 1,
        "blockHash": "cd" * 32,
        "blockHeight": 103,
    }


def test_transaction_status_returns_unknown_for_core_missing_transaction() -> None:
    class MissingTransactionRPC(FakeRPC):
        def get_raw_transaction(self, txid: str, *, verbose: bool = True) -> Any:
            raise BitcoinRPCError("getrawtransaction", -5, "No such mempool or blockchain transaction")

    txid = "12" * 32
    result = RegtestService(MissingTransactionRPC()).transaction_status(txid)  # type: ignore[arg-type]

    assert result == {
        "txid": txid,
        "status": "unknown",
        "confirmations": None,
        "blockHash": None,
        "blockHeight": None,
    }
