"""Công cụ CLI cục bộ nhỏ để tạo địa chỉ Regtest.

Ứng dụng React/FastAPI là luồng giao dịch chính thức. Công cụ này chỉ in dữ liệu
công khai và không bao giờ in khóa riêng tư ra terminal.
"""

from address.address import derive_all_addresses
from crypto.keys import generate_private_key, private_key_to_public_key

_SEPARATOR = "=" * 60


def main() -> int:
    private_key = generate_private_key()
    public_key = private_key_to_public_key(private_key)
    addresses = derive_all_addresses(private_key, "regtest")

    print(_SEPARATOR)
    print("BITCOIN REGTEST - CÔNG CỤ TẠO ĐỊA CHỈ")
    print(_SEPARATOR)
    print("\nKHÓA CÔNG KHAI NÉN")
    print(public_key.hex())
    print("\nP2PKH")
    print(addresses.p2pkh)
    print("\nP2SH-P2WPKH")
    print(addresses.p2sh_p2wpkh)
    print("\nP2WPKH")
    print(addresses.p2wpkh)
    print(f"\n{_SEPARATOR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
