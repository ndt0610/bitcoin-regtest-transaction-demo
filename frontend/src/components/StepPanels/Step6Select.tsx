import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { CoinSelection, UTXO, WalletData } from '../../types';
import { formatSat, formatBtc, truncateHash } from '../../utils/helpers';

interface Step6SelectProps {
  wallet: WalletData;
  utxos: UTXO[];
  selection: CoinSelection;
  minerRecipientAddress: string;
  onRunSelection: (
    amountSat: number,
    feeRateSatVb: number,
    recipient: string,
    selectedUtxos?: UTXO[]
  ) => Promise<void>;
  onNext: () => void;
}

export const Step6Select: React.FC<Step6SelectProps> = ({
  wallet,
  utxos,
  selection,
  minerRecipientAddress,
  onRunSelection,
  onNext
}) => {
  // Mode: 'auto' | 'manual'
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [targetAmount, setTargetAmount] = useState<number>(selection.targetAmountSat || 70_000);
  const [feeRate, setFeeRate] = useState<number>(selection.feeRateSatVb || 2);
  const [recipient, setRecipient] = useState<string>(
    minerRecipientAddress || wallet.addresses.p2wpkh
  );

  // Set of selected UTXO IDs (txid:vout)
  const [selectedUtxoIds, setSelectedUtxoIds] = useState<Set<string>>(() => {
    if (selection.selectedUtxos && selection.selectedUtxos.length > 0) {
      return new Set(selection.selectedUtxos.map((u) => `${u.txid}:${u.vout}`));
    }
    // Default select all available active UTXOs
    return new Set(utxos.filter((u) => !u.isSpent).map((u) => `${u.txid}:${u.vout}`));
  });

  const [loading, setLoading] = useState(false);

  // Available unspent UTXOs
  const activeUtxos = useMemo(() => utxos.filter((u) => !u.isSpent), [utxos]);

  // Handle toggle selection for a UTXO
  const toggleUtxo = (key: string) => {
    setSelectedUtxoIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Get array of selected UTXOs based on mode
  const currentSelectedUtxos = useMemo(() => {
    if (mode === 'manual') {
      return activeUtxos.filter((u) => selectedUtxoIds.has(`${u.txid}:${u.vout}`));
    }
    // Auto Greedy: Sort largest first, pick until target + estimated fee
    const sorted = [...activeUtxos].sort((a, b) => b.valueSat - a.valueSat);
    const chosen: UTXO[] = [];
    let acc = 0;
    const approxNeed = targetAmount + 700; // rough buffer
    for (const u of sorted) {
      chosen.push(u);
      acc += u.valueSat;
      if (acc >= approxNeed) break;
    }
    return chosen.length > 0 ? chosen : sorted.slice(0, 1);
  }, [mode, activeUtxos, selectedUtxoIds, targetAmount]);

  // Dynamic vSize calculation based on actual chosen script types!
  // P2PKH input ≈ 148 vB, P2SH-P2WPKH ≈ 91 vB, P2WPKH ≈ 68 vB
  // Base tx overhead: ~10 vB, 2 outputs (recipient + change P2WPKH) ≈ 62 vB
  const dynamicVSize = useMemo(() => {
    let inputVSize = 0;
    currentSelectedUtxos.forEach((u) => {
      if (u.addressType === 'p2pkh') inputVSize += 148;
      else if (u.addressType === 'p2shP2wpkh') inputVSize += 91;
      else inputVSize += 68;
    });
    const overhead = 10 + 34 + 31; // base + recipient out + change out
    return Math.max(140, inputVSize + overhead);
  }, [currentSelectedUtxos]);

  const totalInputSat = useMemo(() => {
    return currentSelectedUtxos.reduce((sum, u) => sum + u.valueSat, 0);
  }, [currentSelectedUtxos]);

  const calculatedFeeSat = dynamicVSize * feeRate;
  const totalRequiredSat = targetAmount + calculatedFeeSat;
  const changeSat = totalInputSat - totalRequiredSat;
  const isInsufficient = totalInputSat < totalRequiredSat;
  const isDust = targetAmount < 546;

  // Auto update when inputs change
  const handleApplySelection = async () => {
    setLoading(true);
    await onRunSelection(targetAmount, feeRate, recipient, currentSelectedUtxos);
    setLoading(false);
  };

  const handleUseMinerAddress = () => {
    setRecipient(minerRecipientAddress || 'bcrt1q8v67484p9l5cvy4h4q047248e58a7kwh8jcv82');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bước 6: Can Thiệp & Thuật Toán Lựa Chọn UTXO (Coin Selection)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/40">
                  CAN THIỆP THAM SỐ TỰ DO
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Bạn có toàn quyền can thiệp vào các biến số: số tiền gửi, mức phí mạng (sat/vB), địa chỉ nhận, và tự tay tích chọn (hoặc bỏ chọn) từng UTXO đầu vào để quan sát thuật toán và phương trình kế toán phản hồi trực tiếp thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Tự Chọn Thủ Công</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'auto'
                    ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Thuật Toán Tự Động</span>
              </button>
            </div>

            <button
              id="step6-select-btn"
              onClick={handleApplySelection}
              disabled={loading || isInsufficient || isDust}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang áp dụng...' : 'Áp Dụng Chỉ Số'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Control Panel */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Bảng Điều Khiển Tham Số Giao Dịch
          </span>
          <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
            Thay đổi các số liệu bên dưới để xem hệ số biến đổi trực tiếp
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Target Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Số tiền muốn gửi (Satoshi):
              </label>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                ≈ {formatBtc(targetAmount)}
              </span>
            </div>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Math.max(0, Number(e.target.value)))}
              step="5000"
              min="546"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
            {/* Quick amount presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {[20_000, 50_000, 70_000, 100_000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTargetAmount(amt)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    targetAmount === amt
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {formatSat(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Mức phí mạng (Fee Rate):
              </label>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                {feeRate} sat/vB
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={feeRate}
                onChange={(e) => setFeeRate(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400">
                <span>1 sat/vB (Thấp)</span>
                <span>5 sat/vB (Vừa)</span>
                <span>20+ sat/vB (Ưu tiên)</span>
              </div>
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Địa chỉ người nhận:
              </label>
              <button
                type="button"
                onClick={handleUseMinerAddress}
                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Ví Thợ Đào Demo
              </button>
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[11px]"
            />
            <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 truncate">
              {recipient}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive UTXO Selection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Can Thiệp Lựa Chọn Mẩu Tiền UTXO Trong Ví ({activeUtxos.length} UTXO khả dụng)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
              Đã chọn: {currentSelectedUtxos.length} UTXO
            </span>
          </div>

          {mode === 'manual' && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
              * Click vào từng thẻ để tích chọn / bỏ chọn mẩu tiền
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeUtxos.map((u, idx) => {
            const key = `${u.txid}:${u.vout}`;
            const isSelected =
              mode === 'manual'
                ? selectedUtxoIds.has(key)
                : currentSelectedUtxos.some((cu) => cu.txid === u.txid && cu.vout === u.vout);

            return (
              <div
                key={key}
                onClick={() => mode === 'manual' && toggleUtxo(key)}
                className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 select-none ${
                  mode === 'manual' ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
                } ${
                  isSelected
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-xs ring-1 ring-amber-400/50'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={mode === 'auto'}
                      onChange={() => mode === 'manual' && toggleUtxo(key)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                      UTXO #{idx + 1}: {u.addressType}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatSat(u.valueSat)} sat
                  </span>
                </div>

                <div className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 truncate bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded">
                  Outpoint: {truncateHash(u.txid, 6, 6)}:{u.vout}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                  <span>Trọng lượng đầu vào:</span>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {u.addressType === 'p2pkh' ? '~148 vB' : u.addressType === 'p2shP2wpkh' ? '~91 vB' : '~68 vB'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Constraint & Status Warning */}
      {isDust && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <strong>Cảnh báo Bụi Giao Dịch (Dust Limit):</strong> Số tiền gửi tối thiểu của Bitcoin là 546 satoshi để tránh tạo ra các UTXO rác làm phình to sổ cái.
          </div>
        </div>
      )}

      {isInsufficient && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <strong>Không đủ số dư (Insufficient Funds)!</strong> Tổng UTXO bạn đã chọn là{' '}
            <span className="font-mono font-bold">{formatSat(totalInputSat)} sat</span>, trong khi bạn cần{' '}
            <span className="font-mono font-bold">{formatSat(totalRequiredSat)} sat</span> (gồm tiền gửi + phí thợ đào).{' '}
            <span className="underline font-semibold">
              Hãy tích chọn thêm UTXO khác hoặc giảm bớt số tiền gửi xuống!
            </span>
          </div>
        </div>
      )}

      {!isInsufficient && !isDust && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Số dư hợp lệ!</strong> Bạn đã chọn {currentSelectedUtxos.length} UTXO với tổng{' '}
              <span className="font-mono font-bold">{formatSat(totalInputSat)} sat</span>, dư{' '}
              <span className="font-mono font-bold">{formatSat(changeSat)} sat</span> tiền thừa.
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplySelection}
            className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
          >
            Đồng Bộ Sang Bước Tiếp Theo
          </button>
        </div>
      )}

      {/* Dynamic Accounting Balance Strip */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 text-xs">
        <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" />
            Phương Trình Cân Bằng Kế Toán Động (Real-time Math):
          </span>
          <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
            ∑ Inputs ({formatSat(totalInputSat)}) = Output ({formatSat(targetAmount)}) + Change ({formatSat(changeSat)}) + Fee ({formatSat(calculatedFeeSat)})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-700 dark:text-zinc-300">
              Tổng Đầu Vào ({currentSelectedUtxos.length} UTXO)
            </div>
            <div className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatSat(totalInputSat)} sat
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-700 dark:text-zinc-300">Gửi Cho Người Nhận</div>
            <div className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
              {formatSat(targetAmount)} sat
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-700 dark:text-zinc-300">Tiền Thừa Trả Về (Change)</div>
            <div className={`font-mono font-bold text-sm mt-0.5 ${changeSat < 0 ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
              {formatSat(Math.max(0, changeSat))} sat
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-700 dark:text-zinc-300">
              Phí Thợ Đào ({dynamicVSize} vB)
            </div>
            <div className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 mt-0.5">
              {formatSat(calculatedFeeSat)} sat
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {isInsufficient
            ? '⚠️ Vui lòng điều chỉnh số dư để tiếp tục ký giao dịch'
            : 'Mọi thông số can thiệp đã được kiểm chứng hợp lệ'}
        </span>

        <button
          onClick={async () => {
            await handleApplySelection();
            onNext();
          }}
          disabled={isInsufficient || isDust}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <span>Sang Bước 7: Ký Từng Input</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
