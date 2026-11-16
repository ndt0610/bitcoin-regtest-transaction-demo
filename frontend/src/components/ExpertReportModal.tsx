import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  BookOpen,
  Code2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';

interface ExpertReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpertReportModal: React.FC<ExpertReportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('sec-1');

  if (!isOpen) return null;

  const rawMarkdownContent = `# BÁO CÁO PHÂN TÍCH CHUYÊN GIA: GIẢI MÃ TOÀN BỘ KIẾN TRÚC, THUẬT TOÁN VÀ VÒNG ĐỜI GIAO DỊCH BITCOIN CORE REGTEST

> **Tác giả:** Kỹ sư Trưởng Hệ thống Phân tán & Chuyên gia Giao thức Bitcoin
> **Chủ đề:** Phân tích kỹ thuật chuyên sâu & Đánh giá mô hình trực quan hóa 9 bước vòng đời giao dịch Bitcoin
> **Môi trường thực thi:** Mạng Bitcoin Regtest (Regression Testing Framework)
> **Đối tượng thụ hưởng:** Kỹ sư phần mềm, Nhà nghiên cứu Blockchain, Giảng viên & Sinh viên CNTT

---

## 1. TỔNG QUAN BÀI TOÁN: ỨNG DỤNG WEB NÀY DEMO CÁI GÌ & VÌ SAO NÓ TỒN TẠI?

### 1.1. Thực trạng nhức nhối khi tiếp cận Bitcoin ở góc độ kỹ thuật
Hầu hết mọi người khi nghe đến Bitcoin đều hình dung về một loại "tiền tệ kỹ thuật số" với số dư tài khoản giống như tài khoản ngân hàng (Alice có 2 BTC, chuyển cho Bob 1 BTC thì tài khoản Alice trừ 1, Bob cộng 1). Đây là sai lầm cơ bản lớn nhất.
Trong kiến trúc nguyên bản của Satoshi Nakamoto:
1. Không hề có khái niệm "tài khoản" (Account) hay "số dư" (Balance). Bitcoin chỉ có các mẩu tiền chưa chi tiêu gọi là UTXO (Unspent Transaction Output).
2. Một giao dịch không phải là chuyển số dư, mà là hành động: Gom một số UTXO cũ lại làm Đầu vào (Inputs), dùng Chữ ký điện tử bẻ gãy khóa bảo vệ của chúng, tiêu hủy chúng đi, và tạo ra các UTXO mới làm Đầu ra (Outputs).
3. Khi lập trình viên hoặc sinh viên học Bitcoin Core thông qua dòng lệnh Linux (bitcoind, bitcoin-cli), họ phải đối mặt với hàng chục lệnh JSON-RPC khô khan, các chuỗi mã hex dài ngoằng hàng trăm ký tự, không rõ tiền đi từ đâu về đâu, script nằm ở đâu, phí được trừ ra sao, và tại sao cùng 1 số tiền mà địa chỉ mới (Native SegWit) lại rẻ hơn địa chỉ cũ (Legacy).

### 1.2. Ứng dụng Web Demo này làm nhiệm vụ gì?
Web Demo này là một đài quan sát kính hiển vi (Microscopic Visualizer) trực quan hóa 100% vòng đời khép kín của một giao dịch Bitcoin từ lúc chưa có hạt bụi nào trong sổ cái đến khi tiền nằm an toàn vĩnh viễn trong khối.
Ứng dụng thực hiện 3 sứ mệnh cốt lõi:
- Cụ thể hóa mã hex trừu tượng: Bóc tách từng byte của giao dịch thành các khối màu sắc trực quan (Phiên bản, Inputs, Outpoints, ScriptSig, Witness Stack, Outputs, Locktime).
- So sánh thực nghiệm 3 thế hệ địa chỉ cùng lúc: Đặt Legacy (P2PKH), Nested SegWit (P2SH-P2WPKH) và Native SegWit (P2WPKH) lên cùng một bàn cân để thấy rõ sự tiến hóa của cấu trúc chữ ký.
- Minh họa quy luật bảo toàn năng lượng Satoshi: Chứng minh toán học rằng: Tổng Inputs = Tổng Outputs + Phí Thợ Đào (Miner Fee). Không có một satoshi nào bị mất đi hoặc tự sinh ra ngoài quy tắc đồng thuận.

### 1.3. Bản chất cốt lõi của mạng Regtest: "Phòng thí nghiệm cát" an toàn
Regtest (Regression Testing) là chế độ mạng riêng tư cục bộ (local private blockchain) của Bitcoin Core:
- Độ khó đào bằng 0: Bạn có thể tự mình tạo ra khối mới ngay lập tức chỉ với một câu lệnh RPC generatetoaddress 1 <địa chỉ>.
- Cho phép mô phỏng toàn bộ quy tắc đồng thuận thật 100% của Bitcoin Core mà không tốn phí, không phụ thuộc Internet, và có thể tái tạo lại mọi kịch bản góc chết (edge cases).

---

## 2. BẢN ĐỒ CHIẾN LƯỢC: FLOW 9 BƯỚC VÒNG ĐỜI GIAO DỊCH

- Bước 1: Khởi tạo nút mạng & Kiểm tra nhịp tim RPC (getblockchaininfo)
- Bước 2: Đào mỏ kích hoạt quỹ đúc tiền Coinbase (Quy tắc 101 khối)
- Bước 3: Đúc cặp khóa Secp256k1 & Dẫn xuất 3 thế hệ địa chỉ ví
- Bước 4: Vòi nước Faucet bơm quỹ vào 3 định dạng địa chỉ
- Bước 5: Quét sổ cái tìm UTXO (scantxoutset)
- Bước 6: Thuật toán chọn tiền xu (Coin Selection) & Đo lường trọng lượng (vSize)
- Bước 7: Ký mật mã ECDSA độc lập từng đầu vào (BIP143 Preimage)
- Bước 8: Kiểm dịch Mempool Preflight & Phát sóng mạng P2P (decoderawtransaction, testmempoolaccept, sendrawtransaction)
- Bước 9: Đóng dấu niêm phong khối & Bằng chứng biến đổi trạng thái UTXO

---

## 3. MỔ XẺ THUẬT TOÁN & LOGIC MÃ NGUỒN CỐT LÕI

### 3.1. Thuật toán mật mã đường cong Elliptic SECP256k1 & Dẫn xuất địa chỉ
Bitcoin sử dụng đường cong y^2 = x^3 + 7 (mod p).
Phép nhân điểm K = k * G là hàm một chiều bất khả nghịch.
Khóa công khai nén (Compressed Public Key) giảm kích thước từ 65 bytes xuống còn 33 bytes bằng cách lưu tọa độ x kèm tiền tố 02 (y chẵn) hoặc 03 (y lẻ).

### 3.2. Bản chất khác biệt sống còn của 3 thế hệ Script
- Legacy (P2PKH): Chữ ký DER và Public Key nằm trực tiếp trong scriptSig ở thân giao dịch. Chiếm nhiều dung lượng, dễ bị biến dạng TXID.
- Nested SegWit (P2SH-P2WPKH): Bọc cấu trúc SegWit vào mã kịch bản P2SH để tương thích ngược ví cũ.
- Native SegWit (P2WPKH - bech32): scriptSig hoàn toàn rỗng (0x00). Chữ ký được chuyển toàn bộ sang Witness Stack, được giảm giá 75% phí thợ đào và triệt tiêu vĩnh viễn lỗi Malleability.

### 3.3. Thuật toán Coin Selection (Knapsack & Branch-and-Bound)
- Branch-and-Bound: Cố gắng chọn tổ hợp UTXO có tổng giá trị chính xác bằng Target + Fee để KHÔNG cần tạo tiền thừa (No change).
- Knapsack: Nếu BnB thất bại, chọn ngẫu nhiên các UTXO đủ lớn và tạo ra 1 đầu ra tiền thừa (Change Output) gửi về ví của chính người gửi.

### 3.4. Công thức tính trọng lượng ảo (vSize) và SegWit Discount 75%
Weight = (Base Size * 3) + Total Size
vSize = ceil(Weight / 4)
Mỗi byte trong phần Witness chỉ tính bằng 1/4 byte so với thân giao dịch!

### 3.5. Thuật toán Ký BIP143 SegWit Preimage
Thay vì thuật toán băm O(n^2) cũ của Legacy làm nghẽn CPU máy tính, BIP143 chuẩn hóa 10 trường dữ liệu cam kết một lần duy nhất với độ phức tạp tuyến tính O(n), đồng thời ký kèm giá trị satoshi đầu vào giúp ngăn ngừa gian lận phí.

---

## 4. BẢN CHẤT CÁC VẤN ĐỀ THỰC TẾ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ
- Xóa bỏ hộp đen giao dịch: Hiển thị minh bạch cấu trúc byte của blockchain.
- Tiêu diệt triệt để Chi tiêu kép (Double-spending): Cơ chế hủy UTXO đã dùng và xác thực mempool nghiêm ngặt.
- Khắc phục lỗi Malleability Attack: Làm tiền đề vững chắc cho Lightning Network.
- Tối ưu hóa kinh tế học phí mạng: Tiết kiệm gần 40% chi phí cho doanh nghiệp.

---
Bản báo cáo hoàn chỉnh được lưu trữ tại file: BAO_CAO_CHUYEN_GIA_BITCOIN_REGTEST.md`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(rawMarkdownContent);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([rawMarkdownContent], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'BAO_CAO_CHUYEN_GIA_BITCOIN_REGTEST.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Báo Cáo Phân Tích Chuyên Gia (Toàn Diện & Chuyên Sâu)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300/40">
                  MARKDOWN .MD
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                Phân tích toàn bộ thuật toán, mã nguồn, luồng 9 bước và giải bài toán Bitcoin Core bằng ngôn ngữ đời thường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Đọc Định Dạng
                </span>
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'raw'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Mã Markdown Gốc
                </span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Sao chép toàn bộ Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép .MD'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
              title="Tải file BAO_CAO_CHUYEN_GIA_BITCOIN_REGTEST.md"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải File .md</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {activeTab === 'raw' ? (
            <div className="bg-zinc-950 text-zinc-100 font-mono text-xs p-5 rounded-xl border border-zinc-800 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {rawMarkdownContent}
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto leading-relaxed">
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  Lời Mở Đầu & Đóng Khung Vấn Đề
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  Bản Báo Cáo Chuyên Gia: Giải Mã Trọn Vẹn Hệ Thống Bitcoin Core Regtest
                </h3>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Bản báo cáo này được biên soạn bởi Kỹ sư Trưởng Hệ thống Phân tán, nhằm mục đích phân tích tường tận mọi ngóc ngách của ứng dụng Web Demo: từ lý do ra đời, bản đồ luồng 9 bước, bản chất toán học của thuật toán mật mã SECP256k1, sự tiến hóa của 3 thế hệ địa chỉ ví, thuật toán giải bài toán cái túi Coin Selection, cho đến cơ chế tiêu diệt tận gốc rễ vấn nạn Chi tiêu kép (Double-spending) và Biến dạng giao dịch (Malleability Attack).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    File gốc: BAO_CAO_CHUYEN_GIA_BITCOIN_REGTEST.md
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Trạng thái: Hoàn tất 100%
                  </span>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <span>TỔNG QUAN: WEB DEMO CÁI GÌ & VÌ SAO NÓ TỒN TẠI?</span>
                </div>

                <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    1.1. Thực trạng nhức nhối khi tiếp cận Bitcoin ở góc độ kỹ thuật:
                  </h4>
                  <p>
                    Hầu hết mọi người khi nghe đến Bitcoin đều hình dung về một loại <em>"tiền tệ kỹ thuật số"</em> với số dư tài khoản giống như tài khoản ngân hàng (Alice có 2 BTC, chuyển cho Bob 1 BTC thì tài khoản Alice trừ 1, Bob cộng 1). Đây là <strong>sai lầm cơ bản lớn nhất</strong>.
                  </p>
                  <p>
                    Trong kiến trúc nguyên bản của Satoshi Nakamoto:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Không hề có khái niệm "tài khoản" hay "số dư":</strong> Bitcoin chỉ có các mẩu tiền chưa chi tiêu gọi là <strong>UTXO (Unspent Transaction Output)</strong>.</li>
                    <li><strong>Một giao dịch không phải là chuyển số dư:</strong> Mà là hành động: Gom một số UTXO cũ lại làm <em>Đầu vào (Inputs)</em>, dùng Chữ ký điện tử bẻ gãy khóa bảo vệ của chúng, tiêu hủy chúng đi, và tạo ra các UTXO mới làm <em>Đầu ra (Outputs)</em>.</li>
                    <li><strong>Giao diện đen trắng khó tiếp cận:</strong> Khi sinh viên học bằng terminal Linux, họ phải đối mặt với hàng chục lệnh JSON-RPC khô khan, các chuỗi hex dài ngoằng, không hiểu luồng tiền và script vận hành thế nào.</li>
                  </ul>

                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs pt-2">
                    1.2. Ứng dụng Web Demo này làm nhiệm vụ gì?
                  </h4>
                  <p>
                    Đóng vai trò như một <strong>đài quan sát kính hiển vi</strong> trực quan hóa 100% vòng đời khép kín của một giao dịch Bitcoin từ lúc chưa có hạt bụi nào trong sổ cái đến khi tiền nằm an toàn vĩnh viễn trong khối. Minh họa trực quan phương trình bảo toàn:
                  </p>
                  <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 font-mono text-center font-bold text-amber-800 dark:text-amber-300">
                    ∑ Inputs (120,000 sat) = ∑ Outputs (100,000 sat + 19,240 sat) + Miner Fee (760 sat)
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span>BẢN ĐỒ CHIẾN LƯỢC: FLOW 9 BƯỚC VÒNG ĐỜI GIAO DỊCH</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 1: Bật Nút & RPC</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Kiểm tra cổng giao tiếp <code>getblockchaininfo</code> để đảm bảo máy chủ Regtest đã sẵn sàng phản hồi lệnh.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 2: Đào 101 Khối Khởi Động</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Quy tắc <strong>Coinbase Maturity Rule</strong> (100 block lock) bắt buộc phải đào 101 khối thì tiền thưởng thợ đào 50 BTC đầu tiên mới đủ chín muồi để tiêu.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 3: Dẫn Xuất Khóa & Ví</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Sinh khóa riêng bí mật, tính khóa công khai nén, và dẫn xuất đồng thời 3 loại địa chỉ: Legacy (P2PKH), Nested SegWit (P2SH) và Native SegWit (P2WPKH).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 4: Bơm Tiền Vòi Faucet</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Thợ đào gửi 40,000 sat vào mỗi hòm thư địa chỉ và đào 1 khối xác nhận để đưa tiền chính thức vào sổ cái.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 5: Quét Tìm UTXO</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Dùng <code>scantxoutset</code> để quét nhanh cơ sở dữ liệu Chainstate, tìm ra 3 "tờ tiền lẻ" đang thuộc quyền sở hữu của ví.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 6: Thuật Toán Chọn Xu</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Giải bài toán cái túi: gom đủ 120,000 sat để gửi 100,000 sat, trích 760 sat trả phí thợ đào, và tạo đầu ra thối lại 19,240 sat tiền thừa.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 7: Ký Đa Đầu Vào ECDSA</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Ký độc lập từng input: nhét chữ ký vào scriptSig đối với P2PKH, và tách chữ ký sang Witness Stack đối với P2WPKH.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 8: Kiểm Dịch Mempool</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Kiểm tra giải mã <code>decoderawtransaction</code> và kiểm thử chính sách chấp nhận <code>testmempoolaccept</code> trước khi gọi <code>sendrawtransaction</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Bước 9: Đóng Khối & Chuyển Trạng Thái</div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Đóng gói giao dịch vào khối vĩnh viễn: 3 UTXO cũ bị tiêu hủy (Spent), 2 UTXO mới được sinh ra (Created), kết thúc trọn vẹn vòng đời.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span>MỔ XẺ THUẬT TOÁN & LOGIC MÃ NGUỒN CỐT LÕI</span>
                </div>

                <div className="space-y-3 text-xs bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      1. Đường cong Elliptic SECP256k1 & Nén Khóa Công Khai:
                    </h4>
                    <p>
                      Phương trình: <code className="font-mono text-amber-600 dark:text-amber-400">y² = x³ + 7 (mod p)</code>. Vì tính đối xứng qua trục hoành, với mỗi tọa độ x chỉ có đúng 2 nghiệm y (một chẵn, một lẻ). Do đó khóa công khai chỉ cần lưu x (32 bytes) và 1 byte tiền tố (02 nếu chẵn, 03 nếu lẻ) = <strong>33 bytes</strong> thay vì 65 bytes, giúp giảm kích thước chuỗi khối vĩnh viễn.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      2. Công thức Trọng lượng ảo (vSize) & SegWit Discount 75%:
                    </h4>
                    <p>
                      <code className="font-mono text-amber-600 dark:text-amber-400">Weight = (BaseSize × 3) + TotalSize</code>, từ đó <code className="font-mono text-amber-600 dark:text-amber-400">vSize = ⌈Weight / 4⌉</code>. Mỗi byte dữ liệu chữ ký trong Witness Stack chỉ bị tính trọng lượng bằng <strong>1/4 byte</strong>, giúp người dùng địa chỉ Native SegWit <code>bcrt1q...</code> tiết kiệm tới 40% phí thợ đào.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      3. Thuật toán Ký BIP143 SegWit Preimage:
                    </h4>
                    <p>
                      Giải quyết triệt để thảm họa tính toán hàm băm $O(n^2)$ của thời kỳ Legacy cũ. BIP143 chỉ cần tính hàm băm cam kết 10 trường dữ liệu một lần duy nhất với độ phức tạp tuyến tính $O(n)$, ngăn chặn các cuộc tấn công DoS làm nghẽn CPU của thợ đào.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <span>BẢN CHẤT CÁC VẤN ĐỀ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300">
                      ✓ Tiêu diệt triệt để Chi tiêu kép (Double-Spending)
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Ngay khi khối được đào ở Bước 9, tọa độ UTXO cũ bị xóa khỏi sổ cái. Bất kỳ nỗ lực tái sử dụng nào sẽ bị mempool từ chối ngay lập tức.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
                    <div className="font-bold text-blue-900 dark:text-blue-300">
                      ✓ Khắc phục lỗi Malleability Attack
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Tách chữ ký ra khỏi thân giao dịch giúp TXID trở nên bất biến vĩnh viễn, làm nền tảng vững chắc để xây dựng mạng Lightning Network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs">
          <div className="text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Báo cáo kỹ thuật đã được tạo và lưu trữ tại <code>/BAO_CAO_CHUYEN_GIA_BITCOIN_REGTEST.md</code></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
          >
            Đóng Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
};
