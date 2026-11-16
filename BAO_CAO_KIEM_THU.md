# Báo cáo kiểm thử Bitcoin Transaction Demo

## 1. Thông tin kiểm thử

- Ngày/giờ: `15/09/2026`, khoảng `08:15:13–08:15:17` (Asia/Saigon).
- Thư mục làm việc: `C:\Users\ASUS\Downloads\bitcoin_demo`.
- Hệ điều hành: Windows.
- Python: `3.11.9`.
- Node.js: `v24.16.0`.
- npm: `11.13.0`.
- Bitcoin Core: `31.1.0`.
- Mạng: `regtest`.
- Mock khi chạy: **KHÔNG**.

REAL E2E dùng hai ví mới và các TXID/UTXO cấp coin mới. Không ghi khóa riêng tư,
không dùng lại TXID cũ và không phụ thuộc trạng thái frontend cũ. Chi tiết đầy đủ nằm
trong [REAL_E2E_REPORT.md](REAL_E2E_REPORT.md).

## 2. Test tự động

| Hạng mục | Kết quả |
|---|---|
| Python `pytest` | **PASS — 89 đạt / 0 lỗi** |
| Frontend `npm run lint` | **PASS** |
| Frontend `npm run build` | **PASS** |
| Kiểm tra biên dịch Python | **PASS** |

Bộ test Python có 2 cảnh báo deprecation từ `starlette/httpx` trong
gói phụ thuộc; không có test lỗi và cảnh báo không ảnh hưởng khi chạy demo.

## 3. Lần chạy REAL E2E #1 — PASS

- Bitcoin Core: `31.1.0`; mạng: `regtest`.
- Block bắt đầu: `119`; block cấp coin: `120`; block xác nhận: `121`.
- Địa chỉ ví mới:
  - P2PKH: `mt1euQPp4PuaRTVrWSzQjioeL2SsNJra9v`
  - P2SH-P2WPKH: `2N8iACxDvTtx4cuzc34xbQ9RsqZMDg16JFi`
  - P2WPKH: `bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c`
- TXID cấp coin: `a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240`,
  `2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713`,
  `3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db`.
- Số UTXO: `3`; UTXO đã chọn: `3`.
- Số chữ ký: `3/3`.
- Phí ước tính/vSize: `764 sat` / `382 vB`.
- Phí thực tế: `764 sat`.
- Kích thước giao dịch thô/vSize: `544 bytes` / `380 vB`.
- TXID: `ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd`.
- WTXID: `e41acf1e9ee7bdfcee734ec275154ed657091ab1314e6935aafaeb67c1b9164a`.
- Giải mã bằng Core: **PASS**, 3 input, 2 output.
- `testmempoolaccept`: **ALLOWED**.
- Phát giao dịch: **PASS**, TXID Core trả về khớp TXID cục bộ.
- Mempool: `0 xác nhận`.
- Xác nhận: `1`; block hash
  `51e67f662a417b4876ad26114ab39e6cc08e6aabd6f5ae22da63da0652491ef1`.
- UTXO tiền thừa: `ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd:1`,
  `19.236 sat`, `p2wpkh`.
- UTXO input đã chi biến mất sau quét lại: **Có**.

## 4. Lần chạy REAL E2E #2 — PASS

- Bitcoin Core: `31.1.0`; mạng: `regtest`.
- Block bắt đầu: `121`; block cấp coin: `122`; block xác nhận: `123`.
- Địa chỉ ví mới:
  - P2PKH: `mverjoNa9bii7E2zz1XfSAFhxgAFm9Hr3z`
  - P2SH-P2WPKH: `2N2ZPYTBCV9pE77KGggE8r8AeaaxgW69c13`
  - P2WPKH: `bcrt1q5cyf8ynmrm009p6qt8eyv476azzs3khqty2ekw`
- TXID cấp coin: `0ebcc49c85c4fbef8bd8760459bf2deec3c5539954e9752074188e1aa44a2219`,
  `2ae2b5e4c9dbee7c6c8b8699f869cfb5d699f1d855a4590f326fd474d94726dd`,
  `09d8f32918265d3307e951f71c84bf52d83247e0121db30945313536986424fb`.
- Số UTXO: `3`; UTXO đã chọn: `3`.
- Số chữ ký: `3/3`.
- Phí ước tính/vSize: `764 sat` / `382 vB`.
- Phí thực tế: `764 sat`.
- Kích thước giao dịch thô/vSize: `541 bytes` / `379 vB`.
- TXID: `25afbeb6c1a7f989e33c0e4cac9fddf5a0d74e8a2e9460839879bd9bd33bfd70`.
- WTXID: `08ed5aa727daa072cb79d5005828fb316666318c3c5386f40b76db0dac4633e0`.
- Giải mã bằng Core: **PASS**, 3 input, 2 output.
- `testmempoolaccept`: **ALLOWED**.
- Phát giao dịch: **PASS**, TXID Core trả về khớp TXID cục bộ.
- Mempool: `0 xác nhận`.
- Xác nhận: `1`; block hash
  `79c646e1f841a289ab9ce9d530d838380f1d441495e494f1e6584e99edaf3822`.
- UTXO tiền thừa: `25afbeb6c1a7f989e33c0e4cac9fddf5a0d74e8a2e9460839879bd9bd33bfd70:1`,
  `19.236 sat`, `p2wpkh`.
- UTXO input đã chi biến mất sau quét lại: **Có**.

## 5. Frontend QA

Đã kiểm tra frontend bằng trình duyệt ở hai kích thước yêu cầu:

| Kích thước | Tràn ngang | Phần tử vượt viewport | Nút bị cắt | Console |
|---|---:|---:|---:|---|
| `1366×768` | Không | Không | Không | Không có cảnh báo/lỗi |
| `1920×1080` | Không | Không | Không | Không có cảnh báo/lỗi |

Stepper đã được điều chỉnh phù hợp ở màn hình lớn để 9 bước không bị dồn
chữ; logic và số lượng bước không thay đổi. Dấu tiếng Việt hiển thị đúng, nội dung
dành cho người dùng còn lại chỉ là thuật ngữ kỹ thuật có chủ đích.

## 6. Lỗi gặp phải và xử lý

- Lúc bắt đầu kiểm tra, Bitcoin Core chưa chạy; đã khởi động lại bằng chương trình
  Bitcoin Core cài sẵn và xác minh `chain=regtest`, RPC port `18443`.
- Một patch docstring ban đầu làm lệch indentation trong `network/regtest.py`;
  đã sửa ngay, kiểm tra biên dịch và toàn bộ 89 test sau đó đều PASS.
- Pytest còn 2 cảnh báo deprecation từ gói phụ thuộc `starlette/httpx`; không có
  lỗi chức năng và không cần sửa code nghiệp vụ Bitcoin.

## 7. Kết quả cuối

- DỰ ÁN REAL E2E: **PASS**
- Giao diện tiếng Việt: **PASS**
- Test tự động: **PASS**
- Backend messages và tài liệu: **PASS**
- Kiểm tra giao diện: **PASS**
- SẴN SÀNG THUYẾT TRÌNH: **CÓ**
