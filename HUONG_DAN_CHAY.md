# Hướng dẫn chạy Bitcoin Transaction Demo

Tài liệu này hướng dẫn chạy dự án trên Windows với Bitcoin Core Regtest,
FastAPI và React/Vite. Dự án chỉ dùng node cục bộ, không dùng mock khi chạy.

## 1. Chuẩn bị

Cần cài:

- Bitcoin Core 31.1.0 hoặc tương thích, gồm `bitcoind` và nên có `bitcoin-cli`.
- Python 3.11 trở lên.
- Node.js 20 trở lên và npm.
- Dự án tại `C:\Users\ASUS\Downloads\bitcoin_demo`.

Kiểm tra nhanh:

```powershell
python --version
node --version
npm --version
bitcoind --version
bitcoin-cli --version
```

Nếu `bitcoind`/`bitcoin-cli` không có trong `PATH`, dùng đường dẫn đầy đủ đến
thư mục cài Bitcoin Core khi chạy lệnh. Không cần đưa khóa riêng tư hoặc mật khẩu
thật vào tài liệu hay log.

## 2. Cấu hình Bitcoin Core

Trên Windows, file cấu hình chính thường ở:

```text
%APPDATA%\Bitcoin\bitcoin.conf
```

Mẫu tương ứng nằm trong `bitcoin.conf.example`. Sao chép các dòng sau vào
`bitcoin.conf`, thay `CHANGE_ME` bằng một password chỉ dùng trên máy cục bộ:

```ini
regtest=1
server=1
txindex=1
fallbackfee=0.00001000

[regtest]
rpcuser=bitcoin_demo
rpcpassword=CHANGE_ME
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcport=18443
```

Không dùng password minh họa này cho môi trường thật. Sau khi đổi password,
phải dùng đúng giá trị đó trong `.env`.

## 3. Cấu hình dự án

Mở PowerShell tại thư mục dự án:

```powershell
cd C:\Users\ASUS\Downloads\bitcoin_demo
```

Nếu chưa có môi trường ảo:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Tạo `.env` từ `.env.example` và điền cùng RPC credentials:

```dotenv
BITCOIN_NETWORK=regtest
BITCOIN_RPC_URL=http://127.0.0.1:18443
BITCOIN_RPC_USER=bitcoin_demo
BITCOIN_RPC_PASSWORD=CHANGE_ME
BITCOIN_RPC_WALLET=demo_miner
BITCOIN_RPC_TIMEOUT_SECONDS=30
```

Cài gói phụ thuộc frontend:

```powershell
cd frontend
npm install
cd ..
```

## 4. Khởi động

Mở ba terminal riêng.

### Terminal 1 — Bitcoin Core Regtest

```powershell
cd C:\Users\ASUS\Downloads\bitcoin_demo
bitcoind -regtest
bitcoin-cli -regtest getblockchaininfo
```

Kết quả cần có trường `"chain": "regtest"`. Nếu Bitcoin Core đã chạy như
service nền, chỉ cần chạy lệnh kiểm tra `bitcoin-cli`.

### Terminal 2 — FastAPI

```powershell
cd C:\Users\ASUS\Downloads\bitcoin_demo
.\.venv\Scripts\python.exe -m uvicorn api:app --reload
```

Backend dùng cổng `8000`. Có thể mở tài liệu API tại
`http://127.0.0.1:8000/docs` để kiểm tra readiness, nhưng luồng demo chính
được thao tác trên giao diện.

### Terminal 3 — React/Vite

```powershell
cd C:\Users\ASUS\Downloads\bitcoin_demo\frontend
npm run dev
```

Frontend dùng cổng `5173`.

## 5. Mở giao diện

Mở trình duyệt tại:

```text
http://127.0.0.1:5173
```

Giao diện phải hiển thị **RPC đang kết nối** và mạng `REGTEST`. Nếu chưa kết
nối, bấm **Làm mới trạng thái** sau khi kiểm tra Terminal 1 và Terminal 2.

## 6. Quy trình chạy

Thao tác theo thứ tự trên stepper:

1. Bấm **Làm mới trạng thái** để kiểm tra Bitcoin Core Regtest đang hoạt động.
2. Bấm **Khởi tạo ví thợ đào**.
3. Nếu ví chưa có số dư đủ điều kiện chi, bấm **Đào 101 khối**.
4. Bấm **Tạo ví demo mới** để có khóa riêng tư mới và ba địa chỉ: P2PKH,
   P2SH-P2WPKH, P2WPKH.
5. Bấm **Cấp coin cho mọi địa chỉ**. Faucet tạo ba giao dịch thật vào
   Mempool Regtest.
6. Bấm **Đào 1 khối** để xác nhận các giao dịch cấp coin.
7. Bấm **Lấy UTXO thật**. Bảng phải có UTXO cho các địa chỉ vừa tạo.
8. Nhập địa chỉ nhận Regtest và số tiền phù hợp; mức phí mặc định là `2 sat/vB`.
   Có thể bấm **Dùng địa chỉ nhận demo**.
9. Bấm **Tự động chọn** để Python chọn UTXO và tính phí ước tính.
10. Bấm **Tạo và ký**. Kiểm tra số chữ ký bằng số input đã chọn.
11. Kiểm tra preflight `decoderawtransaction PASS` và
    `testmempoolaccept ALLOWED`, rồi bấm **Phát giao dịch**.
12. Kiểm tra TXID trong Mempool với `0 xác nhận`.
13. Bấm **Đào khối xác nhận**.
14. Kiểm tra block, xác nhận và quét lại UTXO: input đã chi biến mất,
    output tiền thừa mới xuất hiện nếu giao dịch tạo tiền thừa.

## 7. Kiểm tra thành công

Luồng được coi là thành công khi có đủ các dấu hiệu:

- Mạng hiển thị `REGTEST`, RPC đang kết nối, chiều cao block đọc từ node thật.
- Địa chỉ P2PKH, P2SH-P2WPKH và P2WPKH được tạo từ khóa mới.
- TXID cấp coin được Bitcoin Core trả về và giao dịch cấp coin chuyển từ chưa xác nhận
  sang đã xác nhận sau khi đào block.
- Bảng có UTXO thật với `scriptPubKey`, số sat và số xác nhận.
- `N` UTXO đã chọn tạo đúng `N` chữ ký.
- Giao dịch thô được Bitcoin Core giải mã.
- `testmempoolaccept` trả về `ALLOWED`.
- TXID sau khi phát giao dịch khớp TXID tính cục bộ.
- Trước khi đào: Mempool có `0 xác nhận`.
- Sau khi đào: số xác nhận `>= 1` và có chiều cao block.
- UTXO đầu vào đã chi biến mất; UTXO tiền thừa xuất hiện nếu có tiền thừa.

## 8. Lỗi thường gặp

### Bitcoin Core ngoại tuyến

Kiểm tra Bitcoin Core đang chạy với `-regtest`, file `bitcoin.conf` đúng vị trí
và cổng `18443` chưa bị ứng dụng khác chiếm. Chạy lại:

```powershell
bitcoin-cli -regtest getblockchaininfo
```

### Xác thực RPC thất bại

Đối chiếu `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`, `rpcuser` và
`rpcpassword`. Sau khi sửa `.env`, khởi động lại FastAPI.

### Sai mạng

Kết quả `getblockchaininfo` phải có `chain` là `regtest`. Dự án từ chối node
Testnet/Mainnet để bảo vệ phạm vi bài tập.

### Cổng 18443 không khả dụng

Đóng node hoặc ứng dụng đang chiếm cổng, hoặc sửa cấu hình RPC đồng thời ở
Bitcoin Core và `.env`. Không dùng cổng Internet công khai.

### Backend 8000 không khả dụng

Kiểm tra Terminal 2, `.venv` và `requirements.txt`; chạy lại lệnh `uvicorn`.
Đảm bảo frontend dùng API cục bộ `127.0.0.1:8000`.

### Frontend 5173 không khả dụng

Kiểm tra Terminal 3 và chạy `npm install` nếu thiếu gói phụ thuộc. Nếu Vite chọn
cổng khác, đặt lại URL frontend hoặc cập nhật cấu hình CORS tương ứng trước khi
chạy demo.

### Không tìm thấy UTXO

Đảm bảo đã có ví demo, đã bấm Faucet, đã đào ít nhất một block xác nhận cấp coin,
sau đó bấm **Lấy UTXO thật** hoặc **Quét lại**.

### Số dư UTXO không đủ

Giảm số tiền gửi hoặc cấp thêm coin bằng cách chạy lại quy trình với ví demo mới.
Không sửa số dư hay TXID bằng tay.

### Phát giao dịch bị từ chối

Đọc lý do từ chối do Bitcoin Core trả về. Kiểm tra preflight, địa chỉ nhận,
phí, input chưa bị chi và đang chạy đúng Regtest. Tạo lại giao dịch bằng UTXO
mới nếu input đã được dùng.

## Ghi chú an toàn

Đây là ví giáo dục một khóa (single-key) trên Regtest. Không nhập khóa riêng tư có giá trị,
không gửi giao dịch Mainnet và không chia sẻ `.env`. Giao diện chỉ giữ private
key trong bộ nhớ React và gửi đến FastAPI cục bộ cho thao tác ký.
