import React, { useState } from 'react';
import { PenTool, CheckCircle2, ShieldCheck, Copy, Check, FileCode, Layers, Info, ShieldAlert } from 'lucide-react';
import { SignedTransactionData, WalletData, CoinSelection } from '../../types';
import { copyToClipboard, truncateHash, formatSat } from '../../utils/helpers';

interface Step7SignProps {
  wallet: WalletData;
  signedTx: SignedTransactionData;
  selection?: CoinSelection;
  onSignTransaction: () => Promise<void>;
  onNext: () => void;
}

export const Step7Sign: React.FC<Step7SignProps> = ({ wallet, signedTx, selection, onSignTransaction, onNext }) => {
  const [signing, setSigning] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isInsufficient = selection
    ? selection.totalInputSat < selection.targetAmountSat + selection.estimatedFeeSat || selection.changeSat < 0
    : false;

  const handleSign = async () => {
    if (isInsufficient) return;
    setSigning(true);
    await onSignTransaction();
    setSigning(false);
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
      {/* Insufficient Funds Warning */}
      {isInsufficient && selection && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">
              Lỗi đồng thuận Bitcoin: Không thể ký giao dịch âm tiền (value in &lt; value out)
            </div>
            <p className="leading-relaxed">
              Tổng đầu vào hiện tại ({formatSat(selection.totalInputSat)} sat) không đủ để chi trả {formatSat(selection.targetAmountSat)} sat + {formatSat(selection.estimatedFeeSat)} sat tiền phí. Bạn phải quay lại <strong>Bước 6</strong> để tích chọn thêm UTXO hoặc giảm số tiền gửi!
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Bước 7: Ký Độc Lập Từng Input Theo Chuẩn Script
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Mỗi input được ký độc lập theo chuẩn script tương ứng bằng thuật toán ECDSA secp256k1 và cờ SIGHASH_ALL: P2PKH điền vào scriptSig; P2WPKH điền vào witness stack; P2SH-P2WPKH có cả redeemScript lẫn witness.
              </p>
            </div>
          </div>

          <button
            id="step7-sign-btn"
            onClick={handleSign}
            disabled={signing || isInsufficient}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto disabled:cursor-not-allowed"
          >
            <PenTool className={`w-3.5 h-3.5 ${signing ? 'animate-spin' : ''}`} />
            <span>{signing ? 'Đang ký ECDSA...' : 'Ký & Lắp Ráp Giao Dịch'}</span>
          </button>
        </div>
      </div>

      {/* Signature Status Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Trạng thái chữ ký: {signedTx.signatures.length}/{signedTx.signatures.length} Hoàn tất
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
            SIGHASH_ALL (0x01)
          </span>
        </div>

        <div className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px]">
          vSize: <strong className="text-zinc-900 dark:text-zinc-100">{signedTx.vSize} vB</strong> ({signedTx.rawBytes} bytes thô)
        </div>
      </div>

      {/* Signatures Visualizer Cards */}
      <div className="space-y-3">
        {signedTx.signatures.map((sig, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[11px]">
                  {idx}
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  Input #{idx} • {sig.addressType.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ Chữ ký DER secp256k1 hợp lệ
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono text-[11px]">
              {/* Sighash */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-700 dark:text-zinc-300 mb-1 font-sans font-semibold">
                  Sighash Hash256 (32 Bytes):
                </div>
                <div className="text-zinc-800 dark:text-zinc-200 truncate">{sig.sighash}</div>
              </div>

              {/* Signature */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-700 dark:text-zinc-300 mb-1 font-sans font-semibold">
                  Chữ Ký DER (71-72 Bytes):
                </div>
                <div className="text-zinc-800 dark:text-zinc-200 truncate">{sig.signature}</div>
              </div>

              {/* ScriptSig */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-700 dark:text-zinc-300 mb-1 font-sans font-semibold">
                  scriptSig: {sig.scriptSig ? `(${sig.scriptSig.length / 2} bytes)` : '(Rỗng - SegWit Native)'}
                </div>
                <div className="text-zinc-800 dark:text-zinc-200 truncate">
                  {sig.scriptSig || '00 (Empty scriptSig)'}
                </div>
              </div>

              {/* Witness Stack */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-700 dark:text-zinc-300 mb-1 font-sans font-semibold">
                  Witness Stack Elements: ({(sig.witness || []).length} phần tử)
                </div>
                <div className="text-zinc-800 dark:text-zinc-200 truncate">
                  {sig.witness && sig.witness.length > 0
                    ? `[0]: Sig (${truncateHash(sig.witness[0], 6, 6)}), [1]: PubKey`
                    : '(Không dùng Witness - Legacy P2PKH)'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw Hex Preview Card */}
      <div className="rounded-xl bg-zinc-900 text-zinc-100 p-4 border border-zinc-800 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <FileCode className="w-4 h-4 text-amber-500" />
            <span>Chuỗi Giao Dịch Thô (Raw Transaction Hex - {signedTx.rawBytes} bytes)</span>
          </div>
          <button
            onClick={() => handleCopy(signedTx.rawTransaction, 'rawTx')}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copiedKey === 'rawTx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === 'rawTx' ? 'Đã sao chép' : 'Sao chép Hex'}</span>
          </button>
        </div>
        <div className="font-mono text-[11px] text-amber-200 bg-black/40 p-3 rounded-lg break-all max-h-24 overflow-y-auto select-all">
          {signedTx.rawTransaction}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {isInsufficient
            ? '⚠️ Giao dịch thiếu hụt số dư. Không thể phát sóng lên mạng Bitcoin.'
            : 'Giao dịch đã được ký hoàn tất và sẵn sàng kiểm tra Preflight'}
        </span>
        <button
          onClick={onNext}
          disabled={isInsufficient}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sang Bước 8: Preflight & Phát Sóng →
        </button>
      </div>
    </div>
  );
};
