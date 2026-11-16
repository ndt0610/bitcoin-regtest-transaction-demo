"""Tests for safe, configurable network settings."""

import pytest

from config import Network, load_settings


def test_default_settings_use_bitcoin_testnet() -> None:
    settings = load_settings({})

    assert settings.network is Network.TESTNET
    assert settings.provider_name == "blockstream"
    assert settings.api_base_url == "https://blockstream.info/testnet/api"
    assert settings.http_timeout_seconds == 30


def test_non_mainnet_network_can_use_an_explicit_provider_url() -> None:
    settings = load_settings(
        {
            "BITCOIN_NETWORK": "signet",
            "BLOCKCHAIN_PROVIDER": "local-esplora",
            "BLOCKCHAIN_API_BASE_URL": "http://127.0.0.1:3000/api/",
        }
    )

    assert settings.network is Network.SIGNET
    assert settings.api_base_url == "http://127.0.0.1:3000/api"


def test_mainnet_is_rejected() -> None:
    with pytest.raises(ValueError, match="Mainnet is intentionally disabled"):
        load_settings({"BITCOIN_NETWORK": "mainnet"})


def test_official_blockstream_mainnet_url_is_rejected() -> None:
    with pytest.raises(ValueError, match="Mainnet endpoints are intentionally disabled"):
        load_settings(
            {
                "BITCOIN_NETWORK": "testnet",
                "BLOCKCHAIN_API_BASE_URL": "https://blockstream.info/api",
            }
        )


@pytest.mark.parametrize("timeout", ["0", "-1", "not-a-number"])
def test_http_timeout_must_be_a_positive_integer(timeout: str) -> None:
    with pytest.raises(ValueError, match="HTTP_TIMEOUT_SECONDS"):
        load_settings({"HTTP_TIMEOUT_SECONDS": timeout})
