import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { StepId, StepStatus, StepMeta } from '../types';

interface StepperNavProps {
  steps: StepMeta[];
  currentStep: StepId;
  stepStatuses: Record<StepId, StepStatus>;
  onSelectStep: (stepId: StepId) => void;
}

export const StepperNav: React.FC<StepperNavProps> = ({
  steps,
  currentStep,
  stepStatuses,
  onSelectStep
}) => {
  // Group steps by phases
  const phases = [
    { id: 1, name: 'Giai Đoạn I: Khởi Tạo Môi Trường', stepIds: [1, 2, 3] },
    { id: 2, name: 'Giai Đoạn II: Nạp Quỹ & UTXO', stepIds: [4, 5] },
    { id: 3, name: 'Giai Đoạn III: Ký Giao Dịch', stepIds: [6, 7] },
    { id: 4, name: 'Giai Đoạn IV: Xác Thực & Khối', stepIds: [8, 9] }
  ];

  return (
    <nav aria-label="Tiến trình 9 bước giao dịch" className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 sm:px-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Phase progress quick indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Tiến trình 9 bước:</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              Đang ở <strong className="text-amber-600 dark:text-amber-400">Bước {currentStep}/9</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            {phases.map((phase) => {
              const allDone = phase.stepIds.every((id) => stepStatuses[id as StepId] === 'completed');
              const isActive = phase.stepIds.includes(currentStep);
              return (
                <div key={phase.id} className="hidden lg:flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      allDone
                        ? 'bg-emerald-500'
                        : isActive
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      isActive
                        ? 'text-amber-700 dark:text-amber-400 font-bold'
                        : allDone
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    GĐ {phase.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stepper Scroll Container */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin no-scrollbar">
          {steps.map((step) => {
            const isCurrent = step.id === currentStep;
            const status = stepStatuses[step.id];
            const isDone = status === 'completed';

            return (
              <button
                key={step.id}
                id={`step-nav-btn-${step.id}`}
                onClick={() => onSelectStep(step.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all text-xs select-none ${
                  isCurrent
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/60 dark:border-amber-500/60 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30'
                    : isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-zinc-800 dark:text-zinc-200 hover:border-emerald-400'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">
                      {step.id}
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                  )}
                </div>

                {/* Step Details */}
                <div className="min-w-0">
                  <div className="font-semibold truncate text-[12px] leading-tight">
                    {step.shortTitle}
                  </div>
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                    {step.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
