# Ma trận yêu cầu

Dự án giữ nguyên API contract và logic Bitcoin đang hoạt động. Mỗi dòng dưới
đây ghi rõ ba trạng thái cần có: đã triển khai, đã kiểm thử tự động và đã xác
minh bằng REAL Regtest E2E.

| Yêu cầu | Ánh xạ triển khai / API / UI | Trạng thái |
|---|---|---|
| 1. Mạng Bitcoin cục bộ + RPC đào block | `RegtestService`, `/api/regtest/status`, `/api/regtest/mine`, `NetworkPanel` | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 2. Tạo các loại địa chỉ | `crypto/keys.py`, `address/address.py`, `WalletPanel` | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 3. Faucet từ miner | `/api/regtest/faucet`, `sendtoaddress`, `FaucetPanel` | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 4. Lấy danh sách UTXO | `/api/regtest/utxos`, `scantxoutset`, `UTXOTable` | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 5. Thu thập/chọn UTXO | `transaction/coin_selection.py`, `/api/transaction/select` | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 6. Ký input bằng SDK | `transaction/signer.py`, metadata `sighash`/`script`/`witness` từng input | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 7. Tạo/kết hợp giao dịch đã ký | Cấu trúc giao dịch của SDK, tuần tự hóa giao dịch thô, preflight | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 8. Phát giao dịch | `/api/transaction/broadcast`, `sendrawtransaction`, kiểm tra TXID | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |
| 9. React UI/UX | Vòng đời 9 bước, khóa khi loading, thông báo lỗi, panel trạng thái trực tiếp | **ĐÃ TRIỂN KHAI · ĐÃ KIỂM THỬ · ĐÃ XÁC MINH E2E THỰC TẾ** |

## Kết luận

Chín yêu cầu đều có ánh xạ cụ thể đến source, endpoint hoặc component. Việc
xác minh E2E cuối cùng và số liệu từng lần chạy được ghi riêng trong
`BAO_CAO_KIEM_THU.md`.
