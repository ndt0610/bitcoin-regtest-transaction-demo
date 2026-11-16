import React, { useState } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';
import { RegtestStatus } from '../../types';
import { copyToClipboard } from '../../utils/helpers';

interface Step1StatusProps {
  status: RegtestStatus;
  onRefresh: () => Promise<void>;
  onNext: () => void;
}

export const Step1Status: React.FC<Step1StatusProps> = ({ status, onRefresh, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const handleCopyCli = async () => {
    const ok = await copyToClipboard('bitcoin-cli -regtest getblockchaininfo');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bước 1: Trạng Thái Mạng Bitcoin Core Regtest
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Kiểm tra kết nối JSON-RPC tới node Bitcoin Core Regtest cục bộ. Môi trường regtest (regression test mode) cho phép tạo blockchain riêng tư tức thời, tự do khai thác khối mà không tốn chi phí thực tế.
              </p>
            </div>
          </div>

          <button
            id="step1-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>{loading ? 'Đang kiểm tra...' : 'Làm mới trạng thái'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Mạng Blockchain</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {status.chain.toUpperCase()}
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">Cổng RPC: 18443</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Chiều Cao Khối (Blocks)</div>
          <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
            #{status.blocks}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">Headers: #{status.headers}</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Phiên Bản Core</div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {status.nodeVersion}
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">JSON-RPC v2.0</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Tiến Trình Xác Minh</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            100% Đồng bộ
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">Verification Progress: 1.0</div>
        </div>
      </div>

      {/* Terminal Command Reference */}
      <div className="rounded-xl bg-zinc-900 text-zinc-100 p-4 border border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">Lệnh kiểm tra tương đương trong terminal</span>
          </div>
          <button
            onClick={handleCopyCli}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
        </div>
        <div className="font-mono text-xs text-amber-300 bg-black/40 px-3 py-2 rounded-md overflow-x-auto">
          bitcoin-cli -regtest getblockchaininfo
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          Kết nối RPC an toàn • Sẵn sàng cho Bước 2
        </span>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
        >
          Sang Bước 2: Ví Thợ Đào →
        </button>
      </div>
    </div>
  );
};
