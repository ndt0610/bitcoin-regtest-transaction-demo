import React, { useState } from 'react';
import { Key, Eye, EyeOff, Copy, Check, RefreshCw, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { WalletData } from '../../types';
import { copyToClipboard, truncateHash } from '../../utils/helpers';

interface Step3WalletProps {
  wallet: WalletData;
  onGenerateNewWallet: () => Promise<void>;
  onNext: () => void;
}

export const Step3Wallet: React.FC<Step3WalletProps> = ({ wallet, onGenerateNewWallet, onNext }) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await onGenerateNewWallet();
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Bước 3: Tạo Ví Demo & Dẫn Xuất 3 Chuẩn Địa Chỉ
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Tạo một cặp khóa mật mã elliptic curve (ECDSA secp256k1). Từ cùng một khóa công khai nén 33 bytes, ta dẫn xuất ra 3 loại địa chỉ chuẩn của mạng Bitcoin Regtest.
              </p>
            </div>
          </div>

          <button
            id="step3-generate-wallet-btn"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Đang sinh...' : 'Tạo Ví Mới (Khóa Mới)'}</span>
          </button>
        </div>
      </div>

      {/* Keys Overview Card */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3.5 shadow-xs">
        {/* Private Key field */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Khóa Riêng Tư (Private Key Hex - 256 bits)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-medium">
                Bảo mật trong RAM
              </span>
            </div>
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPrivateKey ? 'Ẩn khóa' : 'Hiện khóa'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-xs">
            <div className="flex-1 truncate text-zinc-800 dark:text-zinc-200 select-all">
              {showPrivateKey ? wallet.privateKey : '•'.repeat(64)}
            </div>
            <button
              onClick={() => handleCopy(wallet.privateKey, 'privateKey')}
              className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Sao chép Private Key"
            >
              {copiedKey === 'privateKey' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Public Key field */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Khóa Công Khai Nén (Compressed Public Key - 33 Bytes)</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-xs">
            <div className="flex-1 truncate text-zinc-800 dark:text-zinc-200 select-all">
              {wallet.publicKey}
            </div>
            <button
              onClick={() => handleCopy(wallet.publicKey, 'publicKey')}
              className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Sao chép Public Key"
            >
              {copiedKey === 'publicKey' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Addresses Comparison Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          3 Chuẩn Địa Chỉ Được Dẫn Xuất (Derivation)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* P2PKH */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Legacy P2PKH</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono">
                Tiền tố: m / n
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
              Pay-to-PubKey-Hash cổ điển. Sử dụng scriptSig chứa DER signature và public key.
            </p>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded border border-zinc-200 dark:border-zinc-700/80 font-mono text-[11px]">
              <span className="truncate flex-1 text-zinc-800 dark:text-zinc-200">
                {wallet.addresses.p2pkh}
              </span>
              <button
                onClick={() => handleCopy(wallet.addresses.p2pkh, 'p2pkh')}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {copiedKey === 'p2pkh' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* P2SH-P2WPKH */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Nested SegWit</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono">
                Tiền tố: 2
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
              P2SH bọc SegWit v0 (P2WPKH). Có redeemScript trong scriptSig và witness stack.
            </p>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded border border-zinc-200 dark:border-zinc-700/80 font-mono text-[11px]">
              <span className="truncate flex-1 text-zinc-800 dark:text-zinc-200">
                {wallet.addresses.p2shP2wpkh}
              </span>
              <button
                onClick={() => handleCopy(wallet.addresses.p2shP2wpkh, 'p2sh')}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {copiedKey === 'p2sh' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* P2WPKH */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Native SegWit (v0)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono">
                Tiền tố: bcrt1q
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
              Định dạng Bech32 hiện đại. Toàn bộ chữ ký nằm trong Witness, tiết kiệm kích thước vSize.
            </p>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded border border-zinc-200 dark:border-zinc-700/80 font-mono text-[11px]">
              <span className="truncate flex-1 text-zinc-800 dark:text-zinc-200">
                {wallet.addresses.p2wpkh}
              </span>
              <button
                onClick={() => handleCopy(wallet.addresses.p2wpkh, 'p2wpkh')}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {copiedKey === 'p2wpkh' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          Đã tạo đủ 3 loại địa chỉ chuẩn cho bài tập lớn
        </span>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
        >
          Sang Bước 4: Cấp Coin Faucet →
        </button>
      </div>
    </div>
  );
};
