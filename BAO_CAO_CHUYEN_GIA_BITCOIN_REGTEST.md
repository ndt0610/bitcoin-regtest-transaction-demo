# BÁO CÁO PHÂN TÍCH CHUYÊN GIA: GIẢI MÃ TOÀN BỘ KIẾN TRÚC, THUẬT TOÁN VÀ VÒNG ĐỜI GIAO DỊCH BITCOIN CORE REGTEST

> **Tác giả:** Kỹ sư Trưởng Hệ thống Phân tán & Chuyên gia Giao thức Bitcoin
> **Chủ đề:** Phân tích kỹ thuật chuyên sâu & Đánh giá mô hình trực quan hóa 9 bước vòng đời giao dịch Bitcoin
> **Môi trường thực thi:** Mạng Bitcoin Regtest (Regression Testing Framework)
> **Đối tượng thụ hưởng:** Kỹ sư phần mềm, Nhà nghiên cứu Blockchain, Giảng viên & Sinh viên chuyên ngành Công nghệ Thông tin

---

## MỤC LỤC

1. [TỔNG QUAN BÀI TOÁN: ỨNG DỤNG WEB NÀY DEMO CÁI GÌ & VÌ SAO NÓ TỒN TẠI?](#1-tổng-quan-bài-toán)
   - 1.1. Thực trạng nhức nhối khi tiếp cận Bitcoin ở góc độ kỹ thuật
   - 1.2. Ứng dụng Web Demo này làm nhiệm vụ gì?
   - 1.3. Bản chất cốt lõi của mạng Regtest: "Phòng thí nghiệm cát" an toàn
2. [BẢN ĐỒ CHIẾN LƯỢC: FLOW 9 BƯỚC VÒNG ĐỜI GIAO DỊCH (THE 9-STEP LIFECYCLE)](#2-bản-đồ-chiến-lược-9-bước)
   - Bước 1: Khởi tạo nút mạng & Kiểm tra nhịp tim RPC (`getblockchaininfo`)
   - Bước 2: Đào mỏ kích hoạt quỹ đúc tiền Coinbase (Quy tắc 101 khối)
   - Bước 3: Đúc cặp khóa Secp256k1 & Dẫn xuất 3 thế hệ địa chỉ ví
   - Bước 4: Vòi nước Faucet bơm quỹ vào 3 định dạng địa chỉ
   - Bước 5: Quét sổ cái tìm UTXO (`scantxoutset`)
   - Bước 6: Thuật toán chọn tiền xu (Coin Selection) & Đo lường trọng lượng (vSize)
   - Bước 7: Ký mật mã ECDSA độc lập từng đầu vào (BIP143 Preimage)
   - Bước 8: Kiểm dịch Mempool Preflight & Phát sóng mạng P2P
   - Bước 9: Đóng dấu niêm phong khối & Bằng chứng biến đổi trạng thái UTXO
3. [MỔ XẺ THUẬT TOÁN & LOGIC MÃ NGUỒN CỐT LÕI (DEEP CODE & MATH DIVE)](#3-mổ-xẻ-thuật-toán--logic-mã-nguồn)
   - 3.1. Thuật toán mật mã đường cong Elliptic SECP256k1 & Dẫn xuất địa chỉ
   - 3.2. Bản chất khác biệt sống còn của 3 thế hệ Script: P2PKH vs P2SH vs P2WPKH
   - 3.3. Thuật toán Coin Selection (Knapsack & Branch-and-Bound)
   - 3.4. Công thức tính trọng lượng ảo (vSize) và SegWit Discount 75%
   - 3.5. Thuật toán Ký BIP143 SegWit Preimage giải quyết thảm họa $O(n^2)$
4. [BẢN CHẤT CÁC VẤN ĐỀ THỰC TẾ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ](#4-bản-chất-các-vấn-đề-thực-tế-được-giải-quyết)
   - 4.1. Xóa bỏ hoàn toàn "Hộp đen" giao dịch Bitcoin
   - 4.2. Giải quyết bài toán Chi tiêu kép (Double-spending) ở cấp độ byte
   - 4.3. Loại trừ nguy cơ tấn công biến dạng giao dịch (Transaction Malleability)
   - 4.4. Tối ưu hóa kinh tế học phí mạng (Fee Economics)
5. [KẾT LUẬN & ĐÁNH GIÁ CHUYÊN MÔN TOÀN DIỆN](#5-kết-luận--đánh-giá-chuyên-môn)

---

## 1. TỔNG QUAN BÀI TOÁN: ỨNG DỤNG WEB NÀY DEMO CÁI GÌ & VÌ SAO NÓ TỒN TẠI?

### 1.1. Thực trạng nhức nhối khi tiếp cận Bitcoin ở góc độ kỹ thuật

Hầu hết mọi người khi nghe đến Bitcoin đều hình dung về một loại "tiền tệ kỹ thuật số" với số dư tài khoản giống như tài khoản ngân hàng (Alice có 2 BTC, chuyển cho Bob 1 BTC thì tài khoản Alice trừ 1, Bob cộng 1). Đây là **sai lầm cơ bản lớn nhất**.

Trong kiến trúc nguyên bản của Satoshi Nakamoto:
1. **Không hề có khái niệm "tài khoản" (Account) hay "số dư" (Balance).** Bitcoin chỉ có các mẩu tiền chưa chi tiêu gọi là **UTXO (Unspent Transaction Output)**.
2. **Một giao dịch không phải là chuyển số dư**, mà là hành động: Gom một số UTXO cũ lại làm **Đầu vào (Inputs)**, dùng Chữ ký điện tử bẻ gãy khóa bảo vệ của chúng, tiêu hủy chúng đi, và tạo ra các UTXO mới làm **Đầu ra (Outputs)**.
3. Khi lập trình viên hoặc sinh viên học Bitcoin Core thông qua dòng lệnh Linux (`bitcoind`, `bitcoin-cli`), họ phải đối mặt với hàng chục lệnh JSON-RPC khô khan, các chuỗi mã hex dài ngoằng hàng trăm ký tự, không rõ tiền đi từ đâu về đâu, script nằm ở đâu, phí được trừ ra sao, và tại sao cùng 1 số tiền mà địa chỉ mới (Native SegWit) lại rẻ hơn địa chỉ cũ (Legacy).

### 1.2. Ứng dụng Web Demo này làm nhiệm vụ gì?

Web Demo này là **một đài quan sát kính hiển vi (Microscopic Visualizer)** trực quan hóa 100% vòng đời khép kín của một giao dịch Bitcoin từ lúc chưa có hạt bụi nào trong sổ cái đến khi tiền nằm an toàn vĩnh viễn trong khối.

Ứng dụng thực hiện 3 sứ mệnh cốt lõi:
- **Cụ thể hóa mã hex trừu tượng:** Bóc tách từng byte của giao dịch thành các khối màu sắc trực quan (Phiên bản, Inputs, Outpoints, ScriptSig, Witness Stack, Outputs, Locktime).
- **So sánh thực nghiệm 3 thế hệ địa chỉ cùng lúc:** Đặt Legacy (P2PKH), Nested SegWit (P2SH-P2WPKH) và Native SegWit (P2WPKH) lên cùng một bàn cân để thấy rõ sự tiến hóa của cấu trúc chữ ký.
- **Minh họa quy luật bảo toàn năng lượng Satoshi:** Chứng minh toán học rằng: $\sum \text{Inputs} = \sum \text{Outputs} + \text{Phí Thợ Đào (Miner Fee)}$. Không có một satoshi nào bị mất đi hoặc tự sinh ra ngoài quy tắc đồng thuận.

### 1.3. Bản chất cốt lõi của mạng Regtest: "Phòng thí nghiệm cát" an toàn

Trên mạng chính (Mainnet), 1 khối cần trung bình 10 phút để đào với độ khó cực lớn và tốn tiền thật. Trên mạng thử nghiệm công khai (Testnet/Signet), bạn phải phụ thuộc vào các vòi Faucet cộng đồng chậm chạp.

**Regtest (Regression Testing)** là chế độ mạng riêng tư cục bộ (local private blockchain) của Bitcoin Core:
- Độ khó đào bằng 0: Bạn có thể tự mình tạo ra khối mới ngay lập tức chỉ với một câu lệnh RPC `generatetoaddress 1 <địa chỉ>`.
- Cho phép mô phỏng toàn bộ quy tắc đồng thuận thật 100% của Bitcoin Core mà không tốn phí, không phụ thuộc Internet, và có thể tái tạo lại mọi kịch bản góc chết (edge cases).

---

## 2. BẢN ĐỒ CHIẾN LƯỢC: FLOW 9 BƯỚC VÒNG ĐỜI GIAO DỊCH (THE 9-STEP LIFECYCLE)

Toàn bộ quy trình trong ứng dụng được thiết kế theo một chuỗi logic tất yếu, không thể đảo ngược, phản ánh đúng cách thức một node Bitcoin Core vận hành:

```
[BƯỚC 1: RPC HEALTH] ──> [BƯỚC 2: MINE 101 BLOCKS] ──> [BƯỚC 3: DERIVE KEYS & ADDR]
                                                                  │
[BƯỚC 6: COIN SELECT] <── [BƯỚC 5: RESCAN UTXO]   <── [BƯỚC 4: FAUCET FUNDING]
         │
         ▼
[BƯỚC 7: SIGN TX]    ──> [BƯỚC 8: MEMPOOL ACCEPT] ──> [BƯỚC 9: MINE & CONFIRM]
```

Dưới đây là phân tích chi tiết từng bước bằng ngôn ngữ đời thường:

---

### Bước 1: Khởi tạo nút mạng & Kiểm tra nhịp tim RPC (`getblockchaininfo`)
- **Nói nôm na:** Bạn mua một chiếc két sắt điện tử về nhà, việc đầu tiên là phải bật nguồn điện, cắm dây mạng và kiểm tra xem bảng điều khiển có phản hồi hay không.
- **Thao tác kỹ thuật:** Gọi lệnh JSON-RPC `getblockchaininfo` đến cổng daemon của `bitcoind`.
- **Dữ liệu trả về:**
  - `chain`: "regtest" (Xác nhận đang ở môi trường thí nghiệm).
  - `blocks`: Chiều cao khối hiện tại.
  - `verificationprogress`: Tiến độ xác thực sổ cái (1.0 tức 100%).
  - `initialblockdownload`: False (Đã sẵn sàng, không cần tải chuỗi từ ai).

---

### Bước 2: Đào mỏ kích hoạt quỹ đúc tiền Coinbase (Quy tắc 101 khối)
- **Nói nôm na:** Bạn vừa mở một quốc gia mới, trong kho bạc chưa có một đồng tiền nào cả. Bạn phải cử đội thợ mỏ đi khai thác những thỏi vàng đầu tiên để đưa tiền vào lưu thông.
- **Câu hỏi hóc búa của chuyên gia:** *Tại sao lại phải đào đúng 101 khối mà không phải 1 khối?*
- **Quy tắc vàng của Bitcoin (Coinbase Maturity Rule):**
  - Khi một khối được đào, thợ đào được thưởng một giao dịch đặc biệt gọi là **Coinbase Transaction** (ở Regtest là 50 BTC).
  - Để ngăn chặn việc xảy ra phân nhánh chuỗi (blockchain reorg) khiến số tiền thưởng này bị biến mất làm loạn thị trường, Bitcoin Core quy định: **Tiền thưởng thợ mỏ phải nằm đóng băng trong 100 khối liên tiếp tiếp theo mới được phép đem ra tiêu!**
  - Do đó, khối số 1 đúc ra 50 BTC thì phải chờ đến khi khối số 101 được đào xong ($101 - 1 = 100$ xác nhận), 50 BTC đầu tiên đó mới chuyển từ trạng thái "Non-spendable" (đóng băng) sang "Spendable" (khả dụng).
- **Lệnh RPC thực thi:** `generatetoaddress 101 <miner_address>`. Kết quả ví thợ đào có 50 BTC chín muồi.

---

### Bước 3: Đúc cặp khóa Secp256k1 & Dẫn xuất 3 thế hệ địa chỉ ví
- **Nói nôm na:** Trước khi nhận tiền từ thợ mỏ, người dùng (Alice) phải đi tạo tài khoản. Nhưng Bitcoin không có biểu mẫu đăng ký, Alice tự tung đồng xu 256 lần trong phòng kín để tạo ra một mật mã tuyệt mật (Private Key), sau đó dùng toán học tính ra các hòm thư công cộng (Địa chỉ) để đưa cho người khác gửi tiền vào.
- **Chi tiết kỹ thuật:**
  - **Khóa riêng (Private Key):** 32 bytes ngẫu nhiên (256 bits). Ví dụ: `7f9b...a1c2`.
  - **Khóa công khai nén (Compressed Public Key):** Nhân khóa riêng với điểm cơ sở $G$ trên đường cong Elliptic $y^2 = x^3 + 7 \pmod p$, thu được tọa độ $(X, Y)$ dài 33 bytes (bắt đầu bằng `02` hoặc `03`).
  - **Từ 1 Khóa công khai, dẫn xuất ra 3 định dạng địa chỉ khác nhau:**
    1. **Legacy (P2PKH):** Băm $RIPEMD160(SHA256(PubKey))$, bọc tiền tố mạng (`0x6f` ở Regtest), mã hóa Base58Check. Bắt đầu bằng chữ `m` hoặc `n`.
    2. **Nested SegWit (P2SH-P2WPKH):** Bọc chứng chỉ SegWit vào bên trong một Script băm P2SH cũ để các ví đời cổ vẫn gửi tiền vào được. Bắt đầu bằng số `2`.
    3. **Native SegWit (P2WPKH):** Chuẩn hiện đại BIP173, dùng mã hóa Bech32 chống nhầm lẫn chữ cái, bắt đầu bằng `bcrt1q`.

---

### Bước 4: Vòi nước Faucet bơm quỹ vào 3 định dạng địa chỉ
- **Nói nôm na:** Thợ mỏ giàu có trích một ít vàng từ mỏ của mình gửi cho Alice 3 phong bì tiền: 1 phong bì gửi vào hòm thư Legacy (40,000 sat), 1 phong bì vào hòm thư Nested SegWit (40,000 sat), 1 phong bì vào hòm thư Native SegWit (40,000 sat).
- **Thao tác kỹ thuật:**
  - Tạo giao dịch chi từ ví miner đến 3 địa chỉ của Alice.
  - Lệnh RPC: `sendtoaddress <address> <amount>`.
  - Đào thêm 1 khối để đóng dấu xác nhận cho các giao dịch nạp tiền này có hiệu lực chính thức.

---

### Bước 5: Quét sổ cái tìm UTXO (`scantxoutset`)
- **Nói nôm na:** Alice mở ví ra kiểm tra xem mình đang sở hữu những "tờ tiền giấy" nào trong túi.
- **Kỹ thuật Bitcoin Core sâu sắc:**
  - Bitcoin Core không lưu trữ danh sách "Ai có bao nhiêu tiền". Nó duy trì một cơ sở dữ liệu tốc độ cao gọi là **UTXO Set (Chainstate)** lưu toàn bộ các đầu ra chưa chi tiêu trên toàn cầu.
  - Lệnh RPC `scantxoutset start "[\"addr(bcrt1q...)\"]"` quét nhanh cơ sở dữ liệu Chainstate này và trả về chính xác:
    + TXID và số thứ tự vout (gọi là **Outpoint** - tọa độ độc nhất của tờ tiền).
    + Giá trị satoshi của tờ tiền.
    + Mã kịch bản khóa (`scriptPubKey`).

---

### Bước 6: Thuật toán chọn tiền xu (Coin Selection) & Đo lường trọng lượng (vSize)
- **Nói nôm na:** Alice muốn mua một món đồ giá 100,000 satoshi của Bob. Trong túi Alice có 3 tờ tiền: Tờ A (40,000 sat), Tờ B (40,000 sat), Tờ C (40,000 sat).
  - Tờ A không đủ 100,000.
  - Tờ A + Tờ B = 80,000 vẫn chưa đủ.
  - Alice bắt buộc phải móc cả 3 tờ A, B, C ra (Tổng = 120,000 sat).
  - Sau khi trả 100,000 sat cho Bob và trích ra một ít trả công cho bưu tá (Phí thợ đào), phần còn lại phải thối về túi Alice (Tiền thừa - Change).
- **Thuật toán giải bài toán cái túi (Knapsack Problem):**
  - Bộ chọn tiền xu sẽ cân đối: Chọn những UTXO nào để tổng đầu vào $\ge$ Số tiền cần gửi + Phí ước tính.
  - Tính toán kích thước ảo (`vSize`): Vì Alice gom 3 đầu vào từ 3 loại script khác nhau (1 P2PKH, 1 P2SH, 1 P2WPKH), kích thước giao dịch sẽ nở to ra khoảng 380 vBytes.
  - Với mức phí 2 sat/vByte, phí thợ đào là $380 \times 2 = 760\text{ sat}$.
  - Tiền thừa thối lại cho Alice: $120,000 - 100,000 - 760 = 19,240\text{ sat}$.
  - Tiền thừa này sẽ tự động được gửi về địa chỉ an toàn nhất của Alice: Native SegWit `bcrt1q...`.

---

### Bước 7: Ký mật mã ECDSA độc lập từng đầu vào (BIP143 Preimage)
- **Nói nôm na:** Đây là trái tim của giao dịch Bitcoin. Alice có 3 tờ tiền cũ, mỗi tờ tiền nằm trong một chiếc hộp có khóa khác nhau. Alice phải dùng chìa khóa riêng của mình để ký tên lên từng chiếc hộp để cho phép mở ra tiêu.
- **Điều kỳ diệu của công nghệ:**
  - **Input 0 (P2PKH):** Chữ ký và khóa công khai được nhét thẳng vào trường `scriptSig`.
  - **Input 1 (P2SH-P2WPKH):** Chữ ký được nhét vào phần `witness`, còn `scriptSig` chỉ chứa mã kịch bản chuyển tiếp (`redeemScript`).
  - **Input 2 (P2WPKH):** `scriptSig` hoàn toàn rỗng (`00`)! Toàn bộ chữ ký DER và khóa công khai được chuyển sang khu vực riêng biệt gọi là **Witness Stack**.
- **Kết quả xuất xưởng:** Một chuỗi Hex giao dịch đã ký hoàn chỉnh (Raw Signed Transaction Hex) sẵn sàng để phát đi.

---

### Bước 8: Kiểm dịch Mempool Preflight & Phát sóng mạng P2P
- **Nói nôm na:** Trước khi bưu điện nhận bức thư của bạn mang đi gửi, nhân viên bưu điện phải soi kính lúp kiểm tra tem thư có giả mạo không, phong bì có hợp lệ không. Nếu hợp lệ, họ mới bỏ bức thư vào thùng thư chờ vận chuyển (Mempool).
- **Hai chốt kiểm soát an ninh của Bitcoin Core:**
  1. `decoderawtransaction <hex>`: Dịch chuỗi hex thô sang định dạng JSON con người đọc được. Kiểm tra cú pháp phiên bản, số lượng đầu vào, đầu ra, locktime.
  2. `testmempoolaccept ["<hex>"]`: Chạy mô phỏng toàn bộ quy tắc đồng thuận thật sự:
     - Chữ ký toán học có đúng với khóa công khai không?
     - 3 tờ tiền đầu vào có đang thực sự tồn tại trong UTXO set không, hay đã bị ai tiêu mất rồi?
     - Mức phí có đạt chuẩn tối thiểu (mempool min fee) không?
  - Khi cả hai lệnh đều báo **PASS & ALLOWED**, node sẽ gọi lệnh cuối cùng: `sendrawtransaction <hex>` để phát sóng cho hàng vạn máy tính khác trên toàn cầu ghi nhận vào hàng đợi Mempool. Lúc này giao dịch có **0 xác nhận (0-conf)**.

---

### Bước 9: Đóng dấu niêm phong khối & Bằng chứng biến đổi trạng thái UTXO
- **Nói nôm na:** Thợ đào gom bức thư của Alice từ thùng thư Mempool, nhét vào một trang sổ cái mới, dùng máy nén thủy lực ép lại thành một khối bê tông kiên cố (Đào khối).
- **Sự chuyển dịch trạng thái bất biến (State Transition):**
  - Khối mới được sinh ra (ví dụ Khối #103). Giao dịch của Alice đạt **1 xác nhận (1-conf)** và không thể đảo ngược.
  - **3 UTXO cũ của Alice (40k + 40k + 40k) chính thức bốc hơi hoàn toàn khỏi sổ cái (Spent)**. Nếu Alice cố tình mang 3 tờ tiền này đi ký giao dịch khác, mạng lưới sẽ quẳng ngay vào sọt rác (chống Double-Spend).
  - **2 UTXO mới được sinh ra trên đời:**
    1. Đầu ra #0: 100,000 satoshi nằm dưới quyền sở hữu của Bob.
    2. Đầu ra #1: 19,240 satoshi tiền thừa quay về ví của Alice, sẵn sàng làm nguồn vốn cho các giao dịch tương lai!

---

## 3. MỔ XẺ THUẬT TOÁN & LOGIC MÃ NGUỒN CỐT LÕI (DEEP CODE & MATH DIVE)

Phần này phân tích kỹ thuật ở cấp độ của các kỹ sư lập trình lõi Bitcoin:

### 3.1. Thuật toán mật mã đường cong Elliptic SECP256k1 & Dẫn xuất địa chỉ

Bitcoin sử dụng đường cong Elliptic Koblitz trên trường hữu hạn $\mathbb{F}_p$:
$$y^2 = x^3 + 7 \pmod p$$
Trong đó số nguyên tố $p = 2^{256} - 2^{32} - 977$.

- Khóa riêng (Private Key) $k$: Một số nguyên ngẫu nhiên thỏa mãn $1 \le k < n$.
- Khóa công khai (Public Key) $K$:
  $$K = k \times G$$
  Với $G$ là điểm cơ sở (Generator Point) chuẩn hóa.
- Phép nhân điểm trên đường cong Elliptic là **hàm một chiều (One-way function)**: Cực dễ tính xuôi $k \times G$, nhưng bất khả thi về mặt toán học để tính ngược lại (Bài toán logarit rời rạc ECDLP).

#### Nén khóa công khai (Compressed Public Key):
Một điểm $K = (x, y)$ gồm 2 tọa độ 32 bytes ($64\text{ bytes}$). Do $y^2 = x^3 + 7$, khi biết $x$, phương trình chỉ có đúng 2 nghiệm đối xứng nhau $y$ và $p - y$ (một chẵn, một lẻ).
Do đó, ta chỉ cần lưu $x$ (32 bytes) và 1 byte tiền tố:
- `0x02` nếu $y$ là số chẵn.
- `0x03` nếu $y$ là số lẻ.
Tổng kích thước giảm từ 65 bytes xuống còn **33 bytes** (tiết kiệm ngay lập tức 32 bytes trên mỗi chữ ký lưu vào blockchain).

---

### 3.2. Bản chất khác biệt sống còn của 3 thế hệ Script: P2PKH vs P2SH vs P2WPKH

Bảng so sánh bản chất kiến trúc giữa 3 loại Script được thể hiện trong demo:

| Tiêu chí | 1. Legacy (P2PKH) | 2. Nested SegWit (P2SH-P2WPKH) | 3. Native SegWit (P2WPKH) |
| :--- | :--- | :--- | :--- |
| **Tiêu chuẩn đề xuất** | Satoshi Nakamoto 2009 | BIP 16 & BIP 141 (2016) | BIP 141 & BIP 173 (2017) |
| **Tiền tố địa chỉ Regtest** | `m` hoặc `n` | `2` | `bcrt1q` |
| **Mã hóa chuỗi ký tự** | Base58Check | Base58Check | Bech32 (Checksum BCH chống gõ sai) |
| **Kịch bản khóa (`scriptPubKey`)** | `OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG` | `OP_HASH160 <20-byte-hash> OP_EQUAL` | `OP_0 <20-byte-hash>` (Version 0 Witness) |
| **Kịch bản mở khóa (`scriptSig`)** | Chứa Chữ ký DER + Public Key | Chứa Script chuyển tiếp (`0x160014...`) | **Hoàn toàn RỖNG (`0x00`)** |
| **Vị trí lưu Chữ ký** | Thân giao dịch (Base Data) | Ngăn xếp nhân chứng (Witness Stack) | Ngăn xếp nhân chứng (Witness Stack) |
| **Khả năng chống Malleability** | Dễ bị thay đổi TXID | Chống biến dạng hoàn toàn | Chống biến dạng hoàn toàn |
| **Hiệu quả giảm phí thợ đào** | Baseline (0%) | Giảm khoảng 25% | **Giảm khoảng 38% - 40%** |

---

### 3.3. Thuật toán Coin Selection (Knapsack & Branch-and-Bound)

Khi tạo giao dịch, ví phải giải quyết bài toán tối ưu hóa tổ hợp: Làm sao chọn tập hợp $U \subseteq \text{UTXOs}$ sao cho:
$$\sum_{u \in U} \text{value}(u) \ge \text{TargetAmount} + \text{Fee}(|U|)$$

Bitcoin Core triển khai 2 thuật toán kế tiếp nhau:
1. **Branch and Bound (BnB):** Tìm kiếm tổ hợp UTXO sao cho tổng giá trị **bằng chính xác** Target + Fee mà **không cần tạo tiền thừa (No Change)**. Nếu làm được điều này, giao dịch bớt đi 1 đầu ra, tiết kiệm được khoảng 31 vBytes và bảo vệ quyền riêng tư người dùng.
2. **Knapsack Solver (Nếu BnB thất bại):** Sắp xếp và chọn ngẫu nhiên các UTXO có giá trị xấp xỉ, chấp nhận tạo ra đầu ra tiền thừa (Change Output) nếu phần tiền thừa vượt qua **Ngưỡng bụi (Dust Limit - 546 satoshi)**.

Trong Web Demo, kịch bản được mô phỏng trực quan: Tổng số dư 3 UTXO là 120,000 sat, mục tiêu gửi 100,000 sat. Không có tổ hợp 1 hoặc 2 UTXO nào đáp ứng đủ nên thuật toán buộc phải chọn toàn bộ 3 UTXO, và tự động tính toán chính xác đầu ra tiền thừa 19,240 sat.

---

### 3.4. Công thức tính trọng lượng ảo (vSize) và SegWit Discount 75%

Trước bản nâng cấp SegWit (BIP 141), kích thước khối bị giới hạn cứng ở 1 Megabyte (1,000,000 bytes). Khi mạng quá tải, phí tăng vọt.

SegWit đưa ra khái niệm mang tính cách mạng: **Khối lượng (Weight Units - WU)**:
$$\text{Weight} = (\text{Base Size} \times 3) + \text{Total Size}$$
Trong đó:
- **Base Size:** Kích thước của các trường không phải witness (Version, Inputs outpoints, Outputs, Locktime).
- **Total Size:** Toàn bộ kích thước giao dịch bao gồm cả dữ liệu chữ ký (Witness Data).

Từ đó, kích thước ảo (**vSize - Virtual Size**) được định nghĩa:
$$\text{vSize} = \left\lceil \frac{\text{Weight}}{4} \right\rceil$$

**Ý nghĩa kinh tế đời thường:**
Mỗi byte của dữ liệu chữ ký (Witness) chỉ bị tính trọng lượng bằng **$\frac{1}{4}$ (tức được giảm giá 75%)** so với mỗi byte của thân giao dịch! Đó là lý do tại sao sử dụng địa chỉ Native SegWit `bcrt1q` giúp người dùng tiết kiệm chi phí khổng lồ khi mạng lưới nghẽn.

---

### 3.5. Thuật toán Ký BIP143 SegWit Preimage giải quyết thảm họa $O(n^2)$

Ở thời kỳ Bitcoin Legacy, khi ký một giao dịch có $N$ inputs, thuật toán phải băm lại toàn bộ thân giao dịch cho mỗi input. Độ phức tạp tính toán tăng theo cấp số nhân $O(n^2)$. Kẻ tấn công có thể tạo một giao dịch khổng lồ với 1,000 inputs khiến các máy tính xác thực bị đơ CPU hàng chục phút (tấn công từ chối dịch vụ DoS).

**BIP 143 chuẩn hóa 10 trường dữ liệu cam kết một lần duy nhất:**
1. `nVersion` (4 bytes)
2. `hashPrevouts` (32 bytes - SHA256 kép của tất cả outpoints)
3. `hashSequence` (32 bytes - SHA256 kép của tất cả nSequence)
4. `outpoint` (36 bytes - input cụ thể đang ký)
5. `scriptCode` (Kịch bản thực thi)
6. `amount` (8 bytes - Số tiền chính xác của input đang ký)
7. `nSequence` (4 bytes)
8. `hashOutputs` (32 bytes - SHA256 kép của tất cả outputs)
9. `nLockTime` (4 bytes)
10. `sighashType` (4 bytes - thông thường là `SIGHASH_ALL = 0x01`)

Nhờ cơ chế này:
- Độ phức tạp giảm về tuyến tính $O(n)$ cực kỳ nhẹ nhàng.
- Khắc phục lỗ hổng phần cứng (Hardware wallet) không biết giá trị satoshi đầu vào nên từng bị lừa ký sai mức phí.

---

## 4. BẢN CHẤT CÁC VẤN ĐỀ THỰC TẾ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ

### 4.1. Xóa bỏ hoàn toàn "Hộp đen" giao dịch Bitcoin
Đối với hầu hết lập trình viên, giao dịch Bitcoin giống như một "hộp đen": Ném tiền vào và hy vọng nó đến đích. Ứng dụng này phẫu thuật hộp đen đó:
- Người học nhìn thấy rõ ràng từng nguyên tử satoshi được bảo tồn.
- Hiểu được tại sao một giao dịch có thể có nhiều người ký khác nhau mà không sợ bị sửa đổi nội dung.

### 4.2. Giải quyết bài toán Chi tiêu kép (Double-spending) ở cấp độ byte
- Nếu Alice có 1 tờ tiền 40,000 sat, Alice tạo 2 giao dịch song song: TX1 gửi cho Bob, TX2 gửi cho Charlie.
- Web demo chứng minh: Ngay khi TX1 được thợ mỏ đóng vào khối ở Bước 9, tọa độ của tờ tiền (`txid:vout`) bị xóa sổ khỏi UTXO Set.
- Khi TX2 được gửi lên, node kiểm tra hàm `testmempoolaccept` ở Bước 8 sẽ báo lỗi ngay lập tức: `bad-txns-inputs-missingorspent` (Đầu vào không tồn tại hoặc đã bị tiêu hủy). Chi tiêu kép bị dập tắt 100% tại tầng đồng thuận mạng.

### 4.3. Loại trừ nguy cơ tấn công biến dạng giao dịch (Transaction Malleability)
Ở địa chỉ cũ Legacy, chữ ký DER nằm chung trong thân giao dịch. Bên thứ ba có thể thay đổi một vài byte phụ trong chữ ký mà chữ ký vẫn hợp lệ về mặt toán học, nhưng làm đổi mã băm `TXID`. Điều này từng khiến các sàn giao dịch đời đầu (như Mt. Gox) bị rút ruột hàng triệu USD do tưởng giao dịch chưa thành công nên gửi tiền lại.
Bằng việc đưa chữ ký sang ngăn xếp Witness ở Bước 7, `TXID` chỉ tính toán dựa trên các thành phần cố định (Outpoints và Outputs). `TXID` trở nên bất biến vĩnh viễn, mở đường cho sự ra đời của mạng thanh toán tia chớp **Lightning Network**.

### 4.4. Tối ưu hóa kinh tế học phí mạng (Fee Economics)
Web demo chỉ rõ sự lãng phí tài nguyên khi dùng ví cũ và sự khôn ngoan khi dùng SegWit/Taproot. Giúp các lập trình viên khi xây dựng cổng thanh toán hoặc ví tiền mã hóa thực tế có thể tiết kiệm hàng chục ngàn USD tiền phí giao dịch mỗi tháng cho doanh nghiệp.

---

## 5. KẾT LUẬN & ĐÁNH GIÁ CHUYÊN MÔN TOÀN DIỆN

### 5.1. Giá trị học thuật & Công nghệ
Ứng dụng Web Demo này không đơn thuần là một sản phẩm giao diện hiển thị, mà là một **hệ thống giáo dục tương tác chuẩn mực về Bitcoin Core**. Nó kết nối hoàn hảo giữa lý thuyết mật mã trừu tượng và thực tiễn triển khai phần mềm ở cấp độ byte.

### 5.2. Các điểm sáng tạo xuất sắc của giải pháp
1. **Kiến trúc mô phỏng kép (Dual-Engine):** Vừa có thể hoạt động độc lập (Mocked Sandbox) trên trình duyệt để trình diễn tức thì ở bất kỳ đâu, vừa sẵn sàng kết nối cổng API 8000 với node Bitcoin Core thật đang chạy bên dưới.
2. **Công thái học hiển thị (Ergonomics):** Chế độ tối chuyên sâu, định dạng cú pháp hex đa màu sắc, hệ thống ghim chỉ số HUD, và tính năng Auto-run 9 bước tự động giải quyết triệt để vấn đề thuyết trình và trải nghiệm người dùng.
3. **Tính chính xác kỹ thuật 100%:** Mọi thuật ngữ, cấu trúc dữ liệu, câu lệnh RPC, và phương trình kế toán satoshi đều bám sát từng dòng mã nguồn chính thức của dự án Bitcoin Core (C++ repository).

---
*Bản báo cáo được trích xuất tự động từ hệ thống phân tích kiến trúc Bitcoin Regtest.*
