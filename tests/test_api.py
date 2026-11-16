"""Tests for the local Testnet wallet-derivation HTTP adapter."""

import pytest
from fastapi.testclient import TestClient

from address.address import derive_all_addresses
from api import INVALID_PRIVATE_KEY_MESSAGE, app
from crypto.keys import (
    SECP256K1_ORDER,
    private_key_from_hex,
    private_key_to_public_key,
)


_PRIVATE_KEY_HEX = "00" * 31 + "01"
_PUBLIC_KEY_HEX = (
    "0279be667ef9dcbbac55a06295ce870b0"
    "7029bfcdb2dce28d959f2815b16f81798"
)
_EXPECTED_ADDRESSES = {
    "p2pkh": "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r",
    "p2shP2wpkh": "2NAUYAHhujozruyzpsFRP63mbrdaU5wnEpN",
    "p2wpkh": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    "p2tr": "tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47zagq",
}

client = TestClient(app)


def test_health_reports_testnet_api_ready() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "network": "testnet"}


def test_generate_wallet_returns_consistent_real_derivation() -> None:
    response = client.post("/api/wallet/generate")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"

    payload = response.json()
    private_key = private_key_from_hex(payload["privateKey"])
    expected_addresses = derive_all_addresses(private_key)

    assert payload["network"] == "testnet"
    assert payload["publicKey"] == private_key_to_public_key(private_key).hex()
    assert payload["addresses"] == {
        "p2pkh": expected_addresses.p2pkh,
        "p2shP2wpkh": expected_addresses.p2sh_p2wpkh,
        "p2wpkh": expected_addresses.p2wpkh,
        "p2tr": expected_addresses.p2tr,
    }


def test_import_valid_private_key_returns_known_vector() -> None:
    response = client.post(
        "/api/wallet/import",
        json={"privateKey": _PRIVATE_KEY_HEX},
    )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "network": "testnet",
        "privateKey": _PRIVATE_KEY_HEX,
        "publicKey": _PUBLIC_KEY_HEX,
        "addresses": _EXPECTED_ADDRESSES,
    }


@pytest.mark.parametrize(
    "invalid_private_key",
    [
        "00" * 32,
        "01",
        "gg" * 32,
        f"{SECP256K1_ORDER:064x}",
    ],
)
def test_import_invalid_private_key_returns_safe_error(
    invalid_private_key: str,
) -> None:
    response = client.post(
        "/api/wallet/import",
        json={"privateKey": invalid_private_key},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": INVALID_PRIVATE_KEY_MESSAGE}
    assert invalid_private_key not in response.text


@pytest.mark.parametrize("body", [{}, {"privateKey": None}, {"privateKey": 1}])
def test_import_missing_or_non_string_key_returns_safe_error(
    body: dict[str, object],
) -> None:
    response = client.post("/api/wallet/import", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": INVALID_PRIVATE_KEY_MESSAGE}


def test_cors_allows_local_frontend_and_rejects_other_origins() -> None:
    preflight_headers = {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
        allowed_response = client.options(
            "/api/wallet/generate",
            headers={**preflight_headers, "Origin": origin},
        )

        assert allowed_response.status_code == 200
        assert allowed_response.headers["access-control-allow-origin"] == origin
        assert "POST" in allowed_response.headers["access-control-allow-methods"]
        assert "access-control-allow-credentials" not in allowed_response.headers

    rejected_response = client.options(
        "/api/wallet/generate",
        headers={**preflight_headers, "Origin": "https://example.com"},
    )

    assert rejected_response.status_code == 400
    assert "access-control-allow-origin" not in rejected_response.headers
