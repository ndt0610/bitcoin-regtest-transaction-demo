import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, Moon, Compass, Eye, ShieldCheck, Zap } from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-zinc-900 dark:text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Báo Cáo Đánh Giá Giao Diện & Nâng Cấp UX Demo
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                Phân tích công thái học thị giác, chế độ tối và tái cấu trúc điều hướng cho Bitcoin Demo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Đánh giá hiện trạng */}
        <div className="space-y-3 text-xs">
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            1. Đánh Giá Hiện Trạng Giao Diện Ban Đầu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
              <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Điểm Mạnh Kỹ Thuật (Strengths)
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                <li>Quy trình 9 bước bao quát trọn vẹn vòng đời giao dịch Bitcoin Core chuẩn.</li>
                <li>Dữ liệu minh bạch: hiển thị rõ scriptSig, witness, UTXO outpoint, byte count, mempool preflight.</li>
                <li>Tích hợp trực tiếp với node Regtest thật qua JSON-RPC không qua trung gian.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
              <div className="font-semibold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Điểm Nghẽn Trải Nghiệm Cũ (Pain Points)
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                <li><strong>Quá tải thị giác (Eye Strain):</strong> Nền sáng cố định gây chói mắt khi đọc mã hex dài (TXID 64 ký tự, raw tx 500+ ký tự, DER signature).</li>
                <li><strong>Điều hướng đơn tuyến cồng kềnh:</strong> 9 bước bị dàn trải hoặc dồn cục, thiếu phân nhóm logic theo giai đoạn.</li>
                <li><strong>Mất ngữ cảnh (Context Loss):</strong> Cuộn xuống dưới làm mất thông tin số dư ví, block height và trạng thái giao dịch.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: Nâng cấp Dark Mode */}
        <div className="space-y-3 text-xs">
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Moon className="w-4 h-4" />
            2. Nâng Cấp Chế Độ Tối (Dark Mode) Chuẩn Công Thái Học
          </h3>
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2 text-zinc-700 dark:text-zinc-300">
            <p>
              • <strong>Bảng màu Zinc/Slate chuyên dụng:</strong> Thay vì nền đen thuần (#000000) gây tương phản gắt (halation effect), hệ thống sử dụng bảng màu trung tính dịu mắt (zinc-900 / zinc-950) với tỷ lệ tương phản đạt chuẩn WCAG AA (&gt; 4.5:1).
            </p>
            <p>
              • <strong>Cú pháp mã hóa màu sắc (Syntax Highlighting):</strong> Các chuỗi hex, mã băm (txid), outpoints và script được phân tách màu cam (amber), xanh lá (emerald) và xanh dương (blue) giúp phân biệt nhanh chóng giữa Private Key, Public Key và Script.
            </p>
            <p>
              • <strong>3 chế độ linh hoạt:</strong> Hỗ trợ Light (Sáng), Dark (Tối) và System (Tự động theo cài đặt hệ điều hành), ghi nhớ lựa chọn bằng localStorage.
            </p>
          </div>
        </div>

        {/* Section 3: Tối ưu hóa điều hướng */}
        <div className="space-y-3 text-xs">
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Compass className="w-4 h-4" />
            3. Hệ Thống Điều Hướng Đa Tầng Tối Ưu (Optimized Navigation)
          </h3>
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2 text-zinc-700 dark:text-zinc-300">
            <p>
              • <strong>Phân nhóm 4 Giai đoạn (Phased Hierarchy):</strong> Gom 9 bước kỹ thuật vào 4 giai đoạn dễ hiểu: <em>Giai đoạn I: Khởi Tạo Môi Trường</em> → <em>Giai đoạn II: Quản Lý Quỹ & UTXO</em> → <em>Giai đoạn III: Ký Giao Dịch</em> → <em>Giai đoạn IV: Xác Thực & Khối</em>.
            </p>
            <p>
              • <strong>Thanh HUD nổi (Sticky Summary HUD):</strong> Luôn hiển thị chiều cao Block, số dư ví hiện tại và trạng thái TXID trên cùng màn hình mà không cần cuộn ngược lại.
            </p>
            <p>
              • <strong>Dock điều hướng dưới chân (Floating Action Dock):</strong> Cung cấp nút Bước Trước / Bước Kế, phím tắt bàn phím (<kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">←</kbd> <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">→</kbd>), và nút <strong>Tự động chạy toàn bộ 9 bước (Auto-run)</strong> giúp hội đồng chấm thi hoặc người dùng trải nghiệm tức thì.
            </p>
            <p>
              • <strong>Chuyển đổi góc nhìn (Dual View Mode):</strong> Dễ dàng đổi giữa chế độ làm việc tập trung (Focused Step Mode) và chế độ toàn cảnh luồng (Pipeline Bird’s Eye View).
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
            Bảng Đối Sánh Trải Nghiệm (Trước & Sau Khi Nâng Cấp):
          </h4>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                <tr>
                  <th className="p-2.5">Tiêu chí</th>
                  <th className="p-2.5">Giao diện gốc</th>
                  <th className="p-2.5 text-amber-600 dark:text-amber-400">Sau khi nâng cấp UX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="p-2.5 font-medium">Chế độ hiển thị</td>
                  <td className="p-2.5">Chỉ có Light mode cố định</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Light / Dark / System tùy chọn</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Cấu trúc Stepper</td>
                  <td className="p-2.5">9 nút phẳng, dễ rối mắt</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Phân cấp 4 Giai đoạn + Tiến trình %</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Điều khiển & Phím tắt</td>
                  <td className="p-2.5">Chỉ bấm chuột thủ công</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Floating dock + Phím mũi tên ← →</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Tiện ích Demo</td>
                  <td className="p-2.5">Phải click 9 lần từng bước</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Nút Auto-run 9 bước tự động chỉ 1 chạm</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Theo dõi số dư & Block</td>
                  <td className="p-2.5">Bị khuất khi cuộn trang</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Sticky Mini-HUD ghim trên đầu trang</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
          >
            Đã Hiểu & Đóng Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
};
