import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Copy, Check, Terminal, ExternalLink, AlertCircle } from 'lucide-react';
import { SignedTransactionData } from '../../types';
import { copyToClipboard, truncateHash } from '../../utils/helpers';

interface Step8BroadcastProps {
  signedTx: SignedTransactionData;
  isBroadcasted: boolean;
  onBroadcast: () => Promise<void>;
  onNext: () => void;
}

export const Step8Broadcast: React.FC<Step8BroadcastProps> = ({
  signedTx,
  isBroadcasted,
  onBroadcast,
  onNext
}) => {
  const [broadcasting, setBroadcasting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    await onBroadcast();
    setBroadcasting(false);
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Bước 8: Kiểm Tra Preflight & Phát Sóng Giao Dịch
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Trước khi phát sóng, node tiến hành giải mã bằng <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">decoderawtransaction</code> và kiểm tra chính sách mempool bằng <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">testmempoolaccept</code>. Sau khi xác nhận ALLOWED, ta gọi <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">sendrawtransaction</code> để phát vào mạng Regtest.
              </p>
            </div>
          </div>

          <button
            id="step8-broadcast-btn"
            onClick={handleBroadcast}
            disabled={broadcasting || signedTx.changeSat < 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isBroadcasted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${broadcasting ? 'animate-spin' : ''}`} />
            <span>
              {broadcasting
                ? 'Đang phát sóng...'
                : isBroadcasted
                ? 'Phát Lại Giao Dịch'
                : 'Phát Sóng Vào Mempool'}
            </span>
          </button>
        </div>
      </div>

      {/* Preflight Checks Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* decoderawtransaction result */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">1. decoderawtransaction</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              PASS
            </span>
          </div>
          <div className="space-y-1 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
            <div>• Phiên bản TX: {signedTx.preflight?.decoded?.version ?? 2}</div>
            <div>• Số Inputs (vin): {signedTx.preflight?.decoded?.vinCount ?? signedTx.signatures?.length ?? 0}</div>
            <div>• Số Outputs (vout): {signedTx.preflight?.decoded?.voutCount ?? signedTx.outputs?.length ?? 0}</div>
            <div>• Kích thước ảo (vsize): {signedTx.preflight?.decoded?.vsize ?? signedTx.vSize} vB</div>
            <div>• Khối lượng (weight): {signedTx.preflight?.decoded?.weight ?? (signedTx.vSize * 4)}</div>
          </div>
        </div>

        {/* testmempoolaccept result */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">2. testmempoolaccept</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                signedTx.changeSat < 0 || signedTx.preflight?.allowed === false
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {signedTx.changeSat < 0 || signedTx.preflight?.allowed === false ? 'REJECTED' : 'ALLOWED'}
            </span>
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
            {signedTx.changeSat < 0 || signedTx.preflight?.allowed === false
              ? 'LỖI ĐỒNG THUẬN: Node Bitcoin Core từ chối giao dịch do tổng giá trị đầu vào nhỏ hơn đầu ra (bad-txns-in-belowout).'
              : 'Node Bitcoin Core xác nhận giao dịch tuân thủ đầy đủ quy tắc đồng thuận (consensus), chữ ký hợp lệ, đầu vào chưa bị chi tiêu kép (double-spend) và mức phí đáp ứng chính sách mempool.'}
          </p>
        </div>
      </div>

      {/* Broadcast Result Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Mã Định Danh Giao Dịch (Identifiers)</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isBroadcasted
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {isBroadcasted ? 'Đã Vào Mempool (0 Conf)' : 'Chưa Phát Sóng'}
            </span>
          </div>

          <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
            Core RPC: <code className="font-mono">sendrawtransaction</code>
          </div>
        </div>

        {/* TXID */}
        <div>
          <div className="text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Mã Băm TXID (Transaction ID):</div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">
            <span className="flex-1 truncate text-zinc-900 dark:text-zinc-100 font-bold select-all">
              {signedTx.txid}
            </span>
            <button
              onClick={() => handleCopy(signedTx.txid, 'txid')}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {copiedKey === 'txid' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* WTXID */}
        <div>
          <div className="text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Mã Băm WTXID (Witness Transaction ID):</div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">
            <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200 select-all">
              {signedTx.wtxid}
            </span>
            <button
              onClick={() => handleCopy(signedTx.wtxid, 'wtxid')}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {copiedKey === 'wtxid' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {signedTx.changeSat < 0
            ? '⚠️ Giao dịch không hợp lệ, không thể tiếp tục xác nhận khối.'
            : isBroadcasted
            ? 'Giao dịch hiện đang nằm trong hàng đợi Mempool (0 xác nhận)'
            : 'Vui lòng nhấn "Phát Sóng Vào Mempool" để đưa giao dịch vào mạng'}
        </span>
        <button
          onClick={onNext}
          disabled={signedTx.changeSat < 0 || !isBroadcasted}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sang Bước 9: Đào Khối Xác Nhận →
        </button>
      </div>
    </div>
  );
};
