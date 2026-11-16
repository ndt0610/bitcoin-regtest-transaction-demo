import React, { useState } from 'react';
import { Pickaxe, ShieldAlert, CheckCircle2, Terminal, Info, Sliders, ArrowRight } from 'lucide-react';
import { RegtestStatus } from '../../types';
import { formatBtc, formatSat } from '../../utils/helpers';

interface Step2MinerProps {
  status: RegtestStatus;
  onMineBlocks: (blocks: number) => Promise<void>;
  onBootstrap: () => Promise<void>;
  onNext: () => void;
}

export const Step2Miner: React.FC<Step2MinerProps> = ({ status, onMineBlocks, onBootstrap, onNext }) => {
  const [mining, setMining] = useState(false);
  const [customBlocks, setCustomBlocks] = useState<number>(1);

  const handleMine = async (count: number) => {
    setMining(true);
    await onMineBlocks(count);
    setMining(false);
  };

  const handleBootstrap = async () => {
    setMining(true);
    await onBootstrap();
    setMining(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Pickaxe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bước 2: Khởi Tạo Ví Thợ Đào & Đào Khối Tùy Chọn
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/40">
                  TÙY CHỌN SỐ KHỐI
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Tải ví thợ đào <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">demo_miner</code> và tự do quyết định đào bao nhiêu khối: đào nhanh 101 khối để kích hoạt Coinbase chín muồi, hoặc đào thử 1, 6 khối để thử nghiệm cơ chế xác nhận.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              id="step2-mine-101-btn"
              onClick={handleBootstrap}
              disabled={mining}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Pickaxe className={`w-3.5 h-3.5 ${mining ? 'animate-bounce' : ''}`} />
              <span>{mining ? 'Đang đào...' : 'Đào 101 Khối (Mở Khóa Tiền)'}</span>
            </button>

            {/* Custom Block Input & Mine Button */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <input
                type="number"
                min="1"
                max="500"
                value={customBlocks}
                onChange={(e) => setCustomBlocks(Math.max(1, Number(e.target.value)))}
                className="w-14 px-2 py-1 text-xs font-mono text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <button
                onClick={() => handleMine(customBlocks)}
                disabled={mining}
                className="px-2.5 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                +{customBlocks} Khối
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Protocol Explanation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-zinc-800 dark:text-zinc-200">
            <div className="font-semibold text-blue-950 dark:text-blue-300">
              Quy tắc đồng thuận: Coinbase Maturity (100 khối)
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Trong Bitcoin, tiền thưởng từ khối đầu tiên (Coinbase Transaction) chỉ được phép chi tiêu sau khi có đúng <strong>100 khối tiếp theo</strong> được khai thác trên nó. Do đó, ta bắt buộc phải đào ít nhất <strong>101 khối</strong> để mở khóa 50 BTC đầu tiên làm nguồn cấp quỹ.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
          <Pickaxe className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-zinc-800 dark:text-zinc-200">
            <div className="font-semibold text-amber-950 dark:text-amber-300">
              Phân biệt: Ví Thợ Đào vs Ví Người Dùng (Alice)
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Bạn đang đào coin vào <strong>VÍ THỢ ĐÀO (<code className="font-mono font-bold">demo_miner</code>)</strong>, chứ <em>chưa phải ví của Alice</em>! Ví Alice sẽ được khởi tạo ở Bước 3, và ở Bước 4 Thợ đào sẽ dùng kho tiền này để Faucet rót vốn sang ví Alice.
            </p>
          </div>
        </div>
      </div>

      {/* Miner Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Tên Ví Thợ Đào</div>
          <div className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
            demo_miner
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Đã nạp vào Core (loadwallet)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Số Dư Khả Dụng Để Cấp Quỹ</div>
          <div className="font-mono font-bold text-base text-amber-600 dark:text-amber-400 mt-1">
            {formatSat(status.minerBalanceSat)} sat
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">
            ≈ {formatBtc(status.minerBalanceSat)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">Độ Dài Chuỗi Hiện Tại</div>
          <div className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1">
            #{status.blocks} Khối
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            {status.blocks >= 101 ? '✓ Đã đủ điều kiện chi tiêu' : '⚠ Cần đào thêm đến khối 101'}
          </div>
        </div>
      </div>

      {/* Terminal Simulation Snippet */}
      <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 space-y-1.5 overflow-x-auto">
        <div className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2">
          # Bitcoin Core JSON-RPC CLI Executed
        </div>
        <div className="text-emerald-400">
          $ bitcoin-cli -regtest -rpcwallet=demo_miner generatetoaddress {customBlocks} "bcrt1q8v67484p9l5cvy4h4q047248e58a7kwh8jcv82"
        </div>
        <div className="text-zinc-400 text-[11px]">
          [ "Block mined successfully. Target hash verified under regtest difficulty zero." ]
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {status.blocks >= 101
            ? 'Khối đã đủ độ chín (Matured). Tiền thưởng sẵn sàng để phân phối.'
            : 'Vui lòng nhấn nút Đào 101 Khối để chuẩn bị số dư.'}
        </span>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Sang Bước 3: Tạo Khóa & Ví</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
