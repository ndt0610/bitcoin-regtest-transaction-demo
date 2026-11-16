import React, { useState } from 'react';
import { Database, RefreshCw, Copy, Check, Filter, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UTXO, AddressType } from '../../types';
import { formatSat, formatBtc, copyToClipboard, truncateHash } from '../../utils/helpers';

interface Step5UtxosProps {
  utxos: UTXO[];
  onRescan: () => Promise<void>;
  onNext: () => void;
}

export const Step5Utxos: React.FC<Step5UtxosProps> = ({ utxos, onRescan, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRescan = async () => {
    setLoading(true);
    await onRescan();
    setLoading(false);
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredUtxos = utxos.filter((u) => {
    if (filterType === 'all') return true;
    return u.addressType === filterType;
  });

  const activeUtxos = filteredUtxos.filter((u) => !u.isSpent);
  const totalSat = activeUtxos.reduce((sum, u) => sum + u.valueSat, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Bước 5: Quét & Lấy Danh Sách UTXO Thật
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Thực thi lệnh <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">scantxoutset</code> trên Bitcoin Core để tìm tất cả các đầu ra chưa chi tiêu (Unspent Transaction Outputs) gắn với bộ 3 địa chỉ ví.
              </p>
            </div>
          </div>

          <button
            id="step5-rescan-btn"
            onClick={handleRescan}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>{loading ? 'Đang quét Core...' : 'Quét Lại UTXO'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Lọc theo chuẩn:</span>
          <div className="flex items-center gap-1">
            {['all', 'p2pkh', 'p2shP2wpkh', 'p2wpkh'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filterType === t
                    ? 'bg-amber-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t === 'all' ? 'Tất cả' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-700 dark:text-zinc-300">Tổng khả dụng:</span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
            {formatSat(totalSat)} sat
          </span>
          <span className="text-zinc-600 dark:text-zinc-400 font-mono">
            ({activeUtxos.length} UTXO)
          </span>
        </div>
      </div>

      {/* UTXO Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">
                <th className="py-2.5 px-4">TXID : VOUT</th>
                <th className="py-2.5 px-4">Loại Địa Chỉ</th>
                <th className="py-2.5 px-4">Giá Trị (Sat)</th>
                <th className="py-2.5 px-4">scriptPubKey</th>
                <th className="py-2.5 px-4 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUtxos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-700 dark:text-zinc-300 text-xs">
                    Chưa có UTXO nào phù hợp. Bấm "Quét Lại UTXO" để lấy từ Core.
                  </td>
                </tr>
              ) : (
                filteredUtxos.map((u) => {
                  const isSpent = u.isSpent;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                        isSpent ? 'opacity-40 line-through bg-zinc-50/50 dark:bg-zinc-900/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                            {truncateHash(u.txid, 6, 6)}:{u.vout}
                          </span>
                          <button
                            onClick={() => handleCopy(`${u.txid}:${u.vout}`, u.id)}
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            title="Sao chép Outpoint"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.addressType === 'p2pkh'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : u.addressType === 'p2shP2wpkh'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {u.addressType.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatSat(u.valueSat)} sat
                        <div className="text-[10px] font-normal text-zinc-700 dark:text-zinc-300">
                          {formatBtc(u.valueSat)}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-1 max-w-[200px] truncate" title={u.scriptPubKey}>
                          <span>{truncateHash(u.scriptPubKey, 8, 6)}</span>
                          <button
                            onClick={() => handleCopy(u.scriptPubKey, `spk-${u.id}`)}
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            {copiedId === `spk-${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isSpent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            Đã chi (Spent)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {u.confirmations} conf • Sẵn sàng
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          Tập hợp UTXO đã được xác thực qua scantxoutset
        </span>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
        >
          Sang Bước 6: Thuật Toán Chọn UTXO →
        </button>
      </div>
    </div>
  );
};
