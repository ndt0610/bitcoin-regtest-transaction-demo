import React, { useState } from 'react';
import { Coins, ArrowRight, CheckCircle2, Copy, Check, Pickaxe, ExternalLink } from 'lucide-react';
import { FaucetItem, WalletData, RegtestStatus } from '../../types';
import { formatSat, formatBtc, copyToClipboard, truncateHash } from '../../utils/helpers';

interface Step4FaucetProps {
  status?: RegtestStatus;
  wallet: WalletData;
  faucetItems: FaucetItem[];
  onTriggerFaucet: (mineBlock: boolean, amountPerAddr?: number) => Promise<void>;
  onMineConfirm: () => Promise<void>;
  onNext: () => void;
}

export const Step4Faucet: React.FC<Step4FaucetProps> = ({
  status,
  wallet,
  faucetItems,
  onTriggerFaucet,
  onMineConfirm,
  onNext
}) => {
  const [loading, setLoading] = useState(false);
  const [mineWithFaucet, setMineWithFaucet] = useState(true);
  const [amountPerAddr, setAmountPerAddr] = useState<number>(40_000);
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

  const handleFaucet = async () => {
    setLoading(true);
    await onTriggerFaucet(mineWithFaucet, amountPerAddr);
    setLoading(false);
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTxid(text);
      setTimeout(() => setCopiedTxid(null), 2000);
    }
  };

  const totalFunded = faucetItems.reduce((acc, item) => acc + item.amountSat, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bước 4: Cấp Coin Faucet Từ Thợ Đào Cho Ví Alice
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/40">
                  TÙY CHỌN SỐ TIỀN
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Ví thợ đào <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">demo_miner</code> trích tiền thưởng Coinbase để gửi lệnh <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">sendtoaddress</code> rót vốn vào từng địa chỉ của Alice (P2PKH, P2SH-P2WPKH, P2WPKH).
              </p>
              {status && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  <Pickaxe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">Nguồn tiền từ Kho Thợ Đào khả dụng:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    {formatBtc(status.minerBalanceSat)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 self-start sm:self-auto">
            {/* Amount input controller */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-1">Mỗi địa chỉ:</span>
              <input
                type="number"
                min="1000"
                step="10000"
                value={amountPerAddr}
                onChange={(e) => setAmountPerAddr(Math.max(1000, Number(e.target.value)))}
                className="w-24 px-2 py-1 text-xs font-mono font-bold text-right bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-amber-600 dark:text-amber-400 focus:outline-none"
              />
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono pr-1">sat</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[40_000, 100_000, 500_000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountPerAddr(val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    amountPerAddr === val
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {formatSat(val)}
                </button>
              ))}
            </div>

            <button
              id="step4-faucet-btn"
              onClick={handleFaucet}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              <Coins className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang gửi coin...' : `Rót ${formatSat(amountPerAddr * 3)} sat vào Ví Alice`}</span>
            </button>

            <label className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mineWithFaucet}
                onChange={(e) => setMineWithFaucet(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-amber-600 focus:ring-amber-500"
              />
              <span>Tự động đào 1 khối xác nhận sau khi cấp</span>
            </label>
          </div>
        </div>
      </div>

      {/* Faucet Summary Metric */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Tổng tiền nạp thành công:</span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
            {formatSat(totalFunded)} sat
          </span>
          <span className="text-[11px] text-zinc-700 dark:text-zinc-300">({formatBtc(totalFunded)})</span>
        </div>

        <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
          3 giao dịch riêng biệt trên mạng Regtest
        </div>
      </div>

      {/* Faucet Transactions Table / Cards */}
      <div className="space-y-3">
        {faucetItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.label}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatSat(item.amountSat)} sat
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                  {item.addressType}
                </span>
              </div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] truncate max-w-md">
                Đích: {item.address}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">
                <span className="text-zinc-700 dark:text-zinc-300">TXID:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {truncateHash(item.txid, 8, 8)}
                </span>
                <button
                  onClick={() => handleCopy(item.txid)}
                  className="p-0.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {copiedTxid === item.txid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  item.confirmations >= 1
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {item.confirmations >= 1 ? `✓ ${item.confirmations} conf` : 'Mempool'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          Cả 3 địa chỉ ví đều đã nhận đủ UTXO đầu vào
        </span>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
        >
          Sang Bước 5: Quét UTXO Thật →
        </button>
      </div>
    </div>
  );
};
