import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { STEPS_METADATA } from '../data/mockData';
import { StepId, StepStatus } from '../types';

interface PipelineOverviewProps {
  currentStep: StepId;
  stepStatuses: Record<StepId, StepStatus>;
  onSelectStep: (stepId: StepId) => void;
  onSwitchToStepper: () => void;
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({
  currentStep,
  stepStatuses,
  onSelectStep,
  onSwitchToStepper
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Toàn Cảnh 9 Bước Vòng Đời Giao Dịch Bitcoin Regtest
              </h2>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Sơ đồ kiến trúc luồng dữ liệu khép kín: Khởi tạo mạng → Dẫn xuất ví → Cấp quỹ Faucet → Lọc UTXO → Ký đa đầu vào ECDSA → Preflight Mempool → Đóng khối xác nhận. Bấm vào bất kỳ bước nào để mở giao diện thao tác chi tiết.
            </p>
          </div>

          <button
            onClick={onSwitchToStepper}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>Quay Lại Chế Độ Từng Bước</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STEPS_METADATA.map((step) => {
          const status = stepStatuses[step.id];
          const isDone = status === 'completed';
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              onClick={() => {
                onSelectStep(step.id);
                onSwitchToStepper();
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2.5 relative group ${
                isCurrent
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/60 dark:border-amber-500/60 ring-2 ring-amber-500/30'
                  : isDone
                  ? 'bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : step.id}
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{step.shortTitle}</span>
                </div>

                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {isDone ? 'Hoàn thành' : isCurrent ? 'Đang thực hiện' : 'Chờ thực hiện'}
                </span>
              </div>

              {/* Description */}
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                {step.description}
              </p>

              {/* Tag & Action */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{step.tag}</span>
                <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-medium flex items-center gap-0.5">
                  Mở chi tiết →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
