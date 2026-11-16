import React, { useState } from 'react';
import { CheckCircle2, Pickaxe, Layers, ShieldCheck, Database, RotateCcw, Copy, Check, ArrowRight } from 'lucide-react';
import { ConfirmationData, SignedTransactionData, UTXO } from '../../types';
import { formatSat, formatBtc, copyToClipboard, truncateHash } from '../../utils/helpers';

interface Step9ConfirmationProps {
  signedTx: SignedTransactionData;
  confirmation: ConfirmationData;
  utxos: UTXO[];
  onMineConfirmBlock: () => Promise<void>;
  onResetDemo: () => void;
  onViewPipeline: () => void;
}

export const Step9Confirmation: React.FC<Step9ConfirmationProps> = ({
  signedTx,
  confirmation,
  utxos,
  onMineConfirmBlock,
  onResetDemo,
  onViewPipeline
}) => {
  const [mining, setMining] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleMine = async () => {
    setMining(true);
    await onMineConfirmBlock();
    setMining(false);
  };

  const handleCopyHash = async () => {
    const ok = await copyToClipboard(confirmation.blockHash);
    if (ok) {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const isConfirmed = confirmation.confirmations >= 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bước 9: Đào Khối Xác Nhận & Cập Nhật UTXO
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                  }`}
                >
                  {isConfirmed ? 'CONFIRMED' : 'WAITING FOR BLOCK'}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Đào 1 khối mới bằng lệnh <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">generatetoaddress</code> để đóng gói giao dịch từ Mempool vào sổ cái bất biến của blockchain Bitcoin. Sau đó quét lại trạng thái UTXO để xác nhận các đầu vào đã chi tiêu và tạo mới đầu ra tiền thừa.
              </p>
            </div>
          </div>

          <button
            id="step9-mine-confirm-btn"
            onClick={handleMine}
            disabled={mining}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Pickaxe className={`w-3.5 h-3.5 ${mining ? 'animate-bounce' : ''}`} />
            <span>{mining ? 'Đang đóng khối...' : 'Đào 1 Khối Xác Nhận'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Block Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Chiều Cao Khối Xác Nhận</div>
          <div className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1">
            Khối #{confirmation.blockHeight}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
            ✓ Số xác nhận: {confirmation.confirmations}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Mã Băm Khối (Block Hash)</div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 mt-1">
            <span className="truncate">{truncateHash(confirmation.blockHash, 8, 8)}</span>
            <button
              onClick={handleCopyHash}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Sao chép Block Hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">
            Thời điểm: {confirmation.timestamp}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Đầu Ra Tiền Thừa (Change Output)</div>
          <div className="font-mono font-bold text-base text-blue-600 dark:text-blue-400 mt-1">
            +{formatSat(signedTx.changeSat)} sat
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">
            vout #1 • Native SegWit (P2WPKH)
          </div>
        </div>
      </div>

      {/* Proof of State Changes: Spent UTXOs vs New Change UTXO */}
      <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span>Bằng Chứng Biến Đổi Trạng Thái UTXO (State Transition Verification)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Spent Inputs */}
          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
            <div className="font-semibold text-rose-900 dark:text-rose-300 flex items-center justify-between">
              <span>1. Các UTXO Đầu Vào Đã Bị Tiêu Hủy (Spent)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 font-mono">
                {confirmation.spentUtxoIds.length} UTXO
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
              Các UTXO này biến mất hoàn toàn khỏi tập hợp UTXO khả dụng của nút mạng để ngăn chặn chi tiêu kép:
            </p>
            <div className="space-y-1 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">
              {confirmation.spentUtxoIds.map((id, i) => (
                <div key={i} className="flex items-center gap-1 line-through opacity-70">
                  <span>✗</span>
                  <span>{truncateHash(id, 10, 6)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Newly Born Change UTXO */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
            <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span>2. UTXO Tiền Thừa Mới Được Sinh Ra (Created)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono">
                vout #1
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
              Đầu ra tiền thừa được ghi nhận vào blockchain và sẵn sàng làm đầu vào cho giao dịch tiếp theo:
            </p>
            <div className="p-2 rounded bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] space-y-1">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                +{formatSat(signedTx.changeSat)} sat ({formatBtc(signedTx.changeSat)})
              </div>
              <div className="text-zinc-700 dark:text-zinc-300 text-[10px] truncate">
                Outpoint: {truncateHash(signedTx.txid, 6, 6)}:1
              </div>
              <div className="text-zinc-700 dark:text-zinc-300 text-[10px] truncate">
                Loại: P2WPKH (bcrt1q...)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onResetDemo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm Mới Vòng Đời Demo</span>
        </button>

        <button
          onClick={onViewPipeline}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
        >
          <span>Xem Toàn Cảnh 9 Bước Luồng Giao Dịch</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
