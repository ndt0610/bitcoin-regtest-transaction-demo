import React, { useState } from 'react';
import { Database, Coins, Layers, CheckCircle2, Copy, Check, Pickaxe, Wallet } from 'lucide-react';
import { formatSat, formatBtc, truncateHash, copyToClipboard } from '../utils/helpers';
import { RegtestStatus, UTXO } from '../types';

interface StickySummaryHUDProps {
  status: RegtestStatus;
  utxos: UTXO[];
  currentTxid?: string;
  txConfirmed: boolean;
  onJumpToStep: (stepId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
}

export const StickySummaryHUD: React.FC<StickySummaryHUDProps> = ({
  status,
  utxos,
  currentTxid,
  txConfirmed,
  onJumpToStep
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedTxid, setCopiedTxid] = useState(false);

  // Active UTXOs balance (Alice's wallet)
  const activeUtxos = utxos.filter((u) => !u.isSpent);
  const totalWalletSat = activeUtxos.reduce((sum, u) => sum + u.valueSat, 0);

  const handleCopyTxid = async () => {
    if (!currentTxid) return;
    const ok = await copyToClipboard(currentTxid);
    if (ok) {
      setCopiedTxid(true);
      setTimeout(() => setCopiedTxid(false), 2000);
    }
  };

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-xs px-4 sm:px-6 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left indicators */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-zinc-700 dark:text-zinc-300">
          {/* Block height */}
          <div className="flex items-center gap-1.5" title="Độ cao chuỗi khối Regtest">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Khối:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              #{status.blocks}
            </span>
          </div>

          {/* Miner Balance */}
          <div
            className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20"
            title="Số dư trong Ví Thợ Đào (Coinbase tích lũy từ đào khối ở Bước 2)"
          >
            <Pickaxe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">Kho Thợ Đào:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
              {formatBtc(status.minerBalanceSat)}
            </span>
          </div>

          {/* Alice's Wallet balance */}
          <div
            className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20"
            title="Số dư trong Ví Người Dùng Alice (Nhận tiền từ Faucet ở Bước 4)"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">Ví Alice:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {formatSat(totalWalletSat)} sat
            </span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 hidden md:inline">
              ({formatBtc(totalWalletSat)})
            </span>
          </div>

          {/* Available UTXOs count */}
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>UTXO Alice:</span>
            <button
              onClick={() => onJumpToStep(5)}
              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {activeUtxos.length} UTXO
            </button>
          </div>
        </div>

        {/* Right side: Latest Txid or Quick Action */}
        <div className="flex items-center gap-2">
          {currentTxid ? (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-xs">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">TXID:</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                {truncateHash(currentTxid, 6, 6)}
              </span>
              <button
                onClick={handleCopyTxid}
                title="Sao chép TXID"
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                {copiedTxid ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  txConfirmed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                }`}
              >
                {txConfirmed ? 'Đã xác nhận' : 'Mempool (0 conf)'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Chưa có giao dịch phát sóng
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
