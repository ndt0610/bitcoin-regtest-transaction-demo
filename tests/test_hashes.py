"""Known vectors for the hash primitives used by Bitcoin."""

import pytest

from crypto.hashes import double_sha256, hash160, ripemd160, sha256


def test_sha256_known_vector() -> None:
    assert sha256(b"abc").hex() == (
        "ba7816bf8f01cfea414140de5dae2223"
        "b00361a396177a9cb410ff61f20015ad"
    )


def test_double_sha256_known_vector() -> None:
    assert double_sha256(b"hello").hex() == (
        "9595c9df90075148eb06860365df3358"
        "4b75bff782a510c6cd4883a419833d50"
    )


def test_ripemd160_and_hash160_known_vectors() -> None:
    assert ripemd160(b"hello").hex() == "108f07b8382412612c048d07d13f814118445acd"
    assert hash160(b"hello").hex() == "b6a9c8c230722b7c748331a8b450f05566dc7d0f"


@pytest.mark.parametrize("hash_function", [sha256, double_sha256, ripemd160, hash160])
def test_hash_functions_reject_non_bytes(hash_function: object) -> None:
    with pytest.raises(TypeError, match="data must be bytes"):
        hash_function("not bytes")  # type: ignore[operator]
