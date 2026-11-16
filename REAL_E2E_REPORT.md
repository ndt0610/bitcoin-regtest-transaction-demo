# Báo cáo REAL Regtest E2E

Hai lần chạy dưới đây được thực hiện ngày `15/09/2026` trên Bitcoin Core
Regtest thật `31.1.0`, qua API contract FastAPI mà giao diện React sử dụng.
Không dùng mock khi chạy, không ghi khóa riêng tư, không dùng lại TXID hoặc ví demo
cũ. Mỗi lần chạy tạo ví và ba địa chỉ mới.

## Kết quả chung

- Mạng: `regtest`
- Bitcoin Core: `31.1.0`
- Cấp coin: ba giao dịch đều ở Mempool với `0 xác nhận` trước khi đào,
  sau đó cùng được xác nhận sau một block.
- Mỗi ví mới nhận đúng 3 UTXO, gồm P2PKH, P2SH-P2WPKH và P2WPKH.
- Amount gửi: `100.000 sat`; mức phí: `2 sat/vB`.
- Mỗi giao dịch chọn `3` input và tạo đúng `3` chữ ký.
- `decoderawtransaction`: PASS; `testmempoolaccept`: `ALLOWED`.
- Phát giao dịch trả về TXID khớp TXID tính cục bộ.
- Sau khi xác nhận, toàn bộ input đã chi biến mất và UTXO tiền thừa `19.236 sat`
  xuất hiện ở vout `1`.

## Lần chạy REAL E2E #1 — PASS

- Thời gian: `2026-09-15 08:15:13 +07:00`
- Block bắt đầu: `119`
- Địa chỉ ví:
  - P2PKH: `mt1euQPp4PuaRTVrWSzQjioeL2SsNJra9v`
  - P2SH-P2WPKH: `2N8iACxDvTtx4cuzc34xbQ9RsqZMDg16JFi`
  - P2WPKH: `bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c`
- TXID cấp coin:
  - P2PKH: `a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240`
  - P2SH-P2WPKH: `2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713`
  - P2WPKH: `3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db`
- Cấp coin trước khi đào: `MEMPOOL`, `0 xác nhận` cho cả ba TXID.
- Block cấp coin: `120`; sau khi đào, cả ba TXID cấp coin có `1 xác nhận`.
- Số UTXO: `3`.
- UTXO đã chọn:
  - `2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713:0`
  - `3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db:0`
  - `a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240:0`
- Số input đã chọn: `3`
- Số chữ ký: `3/3`
- Phí ước tính: `764 sat`; vSize ước tính: `382 vB`.
- Phí thực tế: `764 sat`
- Kích thước giao dịch thô: `544 bytes`; vSize: `380 vB`.
- TXID: `ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd`
- WTXID: `e41acf1e9ee7bdfcee734ec275154ed657091ab1314e6935aafaeb67c1b9164a`
- Giải mã bằng Core: PASS, `3` input, `2` output.
- Phát giao dịch: PASS; TXID Core trả về khớp TXID cục bộ.
- Mempool sau khi phát: `MEMPOOL`, `0 xác nhận`.
- Block xác nhận: chiều cao `121`, hash
  `51e67f662a417b4876ad26114ab39e6cc08e6aabd6f5ae22da63da0652491ef1`.
- Xác nhận: `CONFIRMED`, `1 xác nhận`.
- UTXO tiền thừa: `ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd:1`,
  `19.236 sat`, loại địa chỉ `p2wpkh`.
- UTXO đã chi biến mất: **Có**.

## Lần chạy REAL E2E #2 — PASS

- Thời gian: `2026-09-15 08:15:17 +07:00`
- Block bắt đầu: `121`
- Địa chỉ ví:
  - P2PKH: `mverjoNa9bii7E2zz1XfSAFhxgAFm9Hr3z`
  - P2SH-P2WPKH: `2N2ZPYTBCV9pE77KGggE8r8AeaaxgW69c13`
  - P2WPKH: `bcrt1q5cyf8ynmrm009p6qt8eyv476azzs3khqty2ekw`
- TXID cấp coin:
  - P2PKH: `0ebcc49c85c4fbef8bd8760459bf2deec3c5539954e9752074188e1aa44a2219`
  - P2SH-P2WPKH: `2ae2b5e4c9dbee7c6c8b8699f869cfb5d699f1d855a4590f326fd474d94726dd`
  - P2WPKH: `09d8f32918265d3307e951f71c84bf52d83247e0121db30945313536986424fb`
- Cấp coin trước khi đào: `MEMPOOL`, `0 xác nhận` cho cả ba TXID.
- Block cấp coin: `122`; sau khi đào, cả ba TXID cấp coin có `1 xác nhận`.
- Số UTXO: `3`.
- UTXO đã chọn:
  - `09d8f32918265d3307e951f71c84bf52d83247e0121db30945313536986424fb:1`
  - `0ebcc49c85c4fbef8bd8760459bf2deec3c5539954e9752074188e1aa44a2219:0`
  - `2ae2b5e4c9dbee7c6c8b8699f869cfb5d699f1d855a4590f326fd474d94726dd:0`
- Số input đã chọn: `3`
- Số chữ ký: `3/3`
- Phí ước tính: `764 sat`; vSize ước tính: `382 vB`.
- Phí thực tế: `764 sat`
- Kích thước giao dịch thô: `541 bytes`; vSize: `379 vB`.
- TXID: `25afbeb6c1a7f989e33c0e4cac9fddf5a0d74e8a2e9460839879bd9bd33bfd70`
- WTXID: `08ed5aa727daa072cb79d5005828fb316666318c3c5386f40b76db0dac4633e0`
- Giải mã bằng Core: PASS, `3` input, `2` output.
- Phát giao dịch: PASS; TXID Core trả về khớp TXID cục bộ.
- Mempool sau khi phát: `MEMPOOL`, `0 xác nhận`.
- Block xác nhận: chiều cao `123`, hash
  `79c646e1f841a289ab9ce9d530d838380f1d441495e494f1e6584e99edaf3822`.
- Xác nhận: `CONFIRMED`, `1 xác nhận`.
- UTXO tiền thừa: `25afbeb6c1a7f989e33c0e4cac9fddf5a0d74e8a2e9460839879bd9bd33bfd70:1`,
  `19.236 sat`, loại địa chỉ `p2wpkh`.
- UTXO đã chi biến mất: **Có**.

## Kết luận E2E

- Lần chạy REAL REGTEST E2E #1: **PASS**
- Lần chạy REAL REGTEST E2E #2: **PASS**
- Mock khi chạy: **KHÔNG**
- Chiều cao node cuối cùng sau lần chạy #2: `123`
