"""FastAPI contract tests using a service double instead of a live Core node."""

from __future__ import annotations

from fastapi.testclient import TestClient

from address.address import derive_all_addresses
from api import app, get_regtest_service
from crypto.keys import private_key_from_hex, private_key_to_public_key
from network.regtest import WrongBitcoinNetworkError
from transaction.script import script_pub_key_for_public_key


PRIVATE_KEY_HEX = "00" * 31 + "01"
PRIVATE_KEY = private_key_from_hex(PRIVATE_KEY_HEX)
PUBLIC_KEY = private_key_to_public_key(PRIVATE_KEY)
ADDRESSES = derive_all_addresses(PRIVATE_KEY, "regtest")
RECIPIENT = derive_all_addresses(
    private_key_from_hex("00" * 31 + "02"),
    "regtest",
).p2wpkh


class FakeRegtestService:
    def status(self) -> dict[str, object]:
        return {
            "online": True,
            "chain": "regtest",
            "blocks": 102,
            "wallet": "demo_miner",
            "walletLoaded": True,
            "minerBalanceSat": 4_999_988_000,
        }

    def fetch_utxos(self, addresses: dict[str, str]) -> list[dict[str, object]]:
        values = {
            "p2pkh": 50_000,
            "p2shP2wpkh": 40_000,
            "p2wpkh": 30_000,
        }
        return [
            {
                "txid": f"{index:064x}",
                "vout": 0,
                "valueSat": values[address_type],
                "scriptPubKey": bytes(
                    script_pub_key_for_public_key(PUBLIC_KEY, address_type)
                ).hex(),
                "confirmations": 1,
                "blockHeight": 102,
                "address": address,
                "addressType": address_type,
            }
            for index, (address_type, address) in enumerate(
                addresses.items(),
                start=1,
            )
        ]


def _addresses_payload() -> dict[str, str]:
    return {
        "p2pkh": ADDRESSES.p2pkh,
        "p2shP2wpkh": ADDRESSES.p2sh_p2wpkh,
        "p2wpkh": ADDRESSES.p2wpkh,
    }


def test_generate_wallet_can_explicitly_use_regtest() -> None:
    response = TestClient(app).post("/api/wallet/generate?network=regtest")

    assert response.status_code == 200
    assert response.json()["network"] == "regtest"
    assert response.json()["addresses"]["p2wpkh"].startswith("bcrt1q")


def test_status_and_transaction_endpoints_use_mocked_regtest_service() -> None:
    fake_service = FakeRegtestService()
    app.dependency_overrides[get_regtest_service] = lambda: fake_service
    client = TestClient(app)
    try:
        status_response = client.get("/api/regtest/status")
        selection_response = client.post(
            "/api/transaction/select",
            json={
                "addresses": _addresses_payload(),
                "recipient": RECIPIENT,
                "amountSat": 100_000,
                "feeRateSatVb": 2,
            },
        )
        create_response = client.post(
            "/api/transaction/create",
            json={
                "privateKey": PRIVATE_KEY_HEX,
                "recipient": RECIPIENT,
                "amountSat": 100_000,
                "feeRateSatVb": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert status_response.status_code == 200
    assert status_response.json()["chain"] == "regtest"
    assert selection_response.status_code == 200
    assert selection_response.json()["selection"]["selectedInputCount"] == 3

    assert create_response.status_code == 200
    payload = create_response.json()
    assert payload["network"] == "regtest"
    assert len(payload["signatures"]) == 3
    assert payload["selection"]["selectedInputCount"] == 3
    assert payload["totalInputSat"] == payload["totalOutputSat"] + payload["feeSat"]
    assert payload["rawTransaction"]
    assert len(payload["txid"]) == 64
    assert len(payload["wtxid"]) == 64


def test_status_endpoint_rejects_a_non_regtest_node() -> None:
    class WrongChainService:
        def status(self) -> dict[str, object]:
            raise WrongBitcoinNetworkError("test")

    app.dependency_overrides[get_regtest_service] = lambda: WrongChainService()
    try:
        response = TestClient(app).get("/api/regtest/status")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert "regtest" in response.json()["detail"]


def test_regtest_faucet_rejects_testnet_bech32_address_before_rpc() -> None:
    fake_service = FakeRegtestService()
    app.dependency_overrides[get_regtest_service] = lambda: fake_service
    try:
        response = TestClient(app).post(
            "/api/regtest/faucet",
            json={
                "addresses": {
                    **_addresses_payload(),
                    "p2wpkh": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
                },
                "amountsSat": {
                    "p2pkh": 50_000,
                    "p2shP2wpkh": 40_000,
                    "p2wpkh": 30_000,
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {"detail": "Địa chỉ Regtest p2wpkh không hợp lệ."}
