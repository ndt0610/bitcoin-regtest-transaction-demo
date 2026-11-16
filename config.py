"""Cấu hình từ environment cho các mạng Bitcoin không phải Mainnet."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
import os
from typing import Final, Mapping
from urllib.parse import urlparse

from dotenv import load_dotenv


class Network(StrEnum):
    """Các mạng được dự án học tập này cho phép.

    Mainnet cố ý bị loại bỏ để environment không thể bật nhầm mạng này trong
    quá trình phát triển hoặc thuyết trình.
    """

    TESTNET = "testnet"
    SIGNET = "signet"
    REGTEST = "regtest"


DEFAULT_PROVIDER_NAME: Final[str] = "blockstream"
DEFAULT_HTTP_TIMEOUT_SECONDS: Final[int] = 30
DEFAULT_API_BASE_URLS: Final[Mapping[Network, str]] = {
    Network.TESTNET: "https://blockstream.info/testnet/api",
}


@dataclass(frozen=True, slots=True)
class Settings:
    """Thiết lập ứng dụng không chứa dữ liệu bí mật của ví."""

    network: Network
    provider_name: str
    api_base_url: str
    http_timeout_seconds: int


def _parse_network(raw_value: str) -> Network:
    """Phân tích tên mạng được chỉ rõ và không phải Mainnet."""
    try:
        return Network(raw_value.strip().lower())
    except ValueError as exc:
        allowed = ", ".join(network.value for network in Network)
        raise ValueError(
            f"Unsupported BITCOIN_NETWORK={raw_value!r}; allowed values: {allowed}. "
            "Mainnet is intentionally disabled."
        ) from exc


def _parse_positive_int(raw_value: str, variable_name: str) -> int:
    """Phân tích thiết lập số nguyên dương từ environment với lỗi rõ ràng."""
    try:
        parsed_value = int(raw_value)
    except ValueError as exc:
        raise ValueError(f"{variable_name} must be an integer") from exc

    if parsed_value <= 0:
        raise ValueError(f"{variable_name} must be greater than zero")
    return parsed_value


def _validate_api_base_url(api_base_url: str, network: Network) -> None:
    """Từ chối URL không hợp lệ và endpoint Blockstream sai mạng đã biết.

    Provider tùy chỉnh có thể dùng host bất kỳ nên không thể suy ra mạng an toàn
    từ URL. Tuy nhiên, path Testnet của host Blockstream chính thức đã biết và
    có thể được bảo vệ để tránh dùng nhầm Mainnet.
    """
    parsed_url = urlparse(api_base_url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise ValueError("BLOCKCHAIN_API_BASE_URL must be an absolute HTTP(S) URL")

    if parsed_url.hostname in {"blockstream.info", "www.blockstream.info"}:
        expected_path = "/testnet/api"
        if network is not Network.TESTNET or parsed_url.path.rstrip("/") != expected_path:
            raise ValueError(
                "Official Blockstream URL must point to its Bitcoin Testnet API; "
                "Mainnet endpoints are intentionally disabled"
            )


def load_settings(environ: Mapping[str, str] | None = None) -> Settings:
    """Nạp thiết lập từ mapping được truyền vào hoặc environment của tiến trình.

    Truyền ``environ`` giúp test có tính tất định. Khi bỏ qua, giá trị từ file
    ``.env`` cục bộ được nạp mà không ghi đè biến của tiến trình.
    """
    if environ is None:
        load_dotenv(override=False)
        source: Mapping[str, str] = os.environ
    else:
        source = environ

    network = _parse_network(source.get("BITCOIN_NETWORK", Network.TESTNET.value))
    provider_name = source.get("BLOCKCHAIN_PROVIDER", DEFAULT_PROVIDER_NAME).strip()
    if not provider_name:
        raise ValueError("BLOCKCHAIN_PROVIDER must not be empty")

    configured_url = source.get("BLOCKCHAIN_API_BASE_URL", "").strip()
    if configured_url:
        api_base_url = configured_url.rstrip("/")
    else:
        try:
            api_base_url = DEFAULT_API_BASE_URLS[network]
        except KeyError as exc:
            raise ValueError(
                "BLOCKCHAIN_API_BASE_URL is required for this network"
            ) from exc
    _validate_api_base_url(api_base_url, network)

    http_timeout_seconds = _parse_positive_int(
        source.get(
            "HTTP_TIMEOUT_SECONDS",
            str(DEFAULT_HTTP_TIMEOUT_SECONDS),
        ),
        "HTTP_TIMEOUT_SECONDS",
    )

    return Settings(
        network=network,
        provider_name=provider_name,
        api_base_url=api_base_url,
        http_timeout_seconds=http_timeout_seconds,
    )
