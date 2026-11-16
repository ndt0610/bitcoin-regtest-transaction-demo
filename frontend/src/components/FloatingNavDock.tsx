import React from 'react';
import { ArrowLeft, ArrowRight, Play, RotateCcw, Sparkles } from 'lucide-react';
import { StepId } from '../types';

interface FloatingNavDockProps {
  currentStep: StepId;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onAutoRun: () => void;
  isAutoRunning: boolean;
  onReset: () => void;
  nextStepTitle?: string;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onAutoRun,
  isAutoRunning,
  onReset,
  nextStepTitle
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-2xl">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 transition-all">
        {/* Left: Prev Button */}
        <button
          id="dock-prev-btn"
          onClick={onPrev}
          disabled={currentStep === 1 || isAutoRunning}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Bước trước</span>
          <kbd className="hidden md:inline px-1 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
            ←
          </kbd>
        </button>

        {/* Center: Auto Run & Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="dock-autorun-btn"
            onClick={onAutoRun}
            disabled={isAutoRunning}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isAutoRunning
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20'
            }`}
          >
            {isAutoRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tự động chạy...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tự động 9 bước</span>
              </>
            )}
          </button>

          <button
            id="dock-reset-btn"
            onClick={onReset}
            disabled={isAutoRunning}
            title="Làm mới trạng thái demo về ban đầu"
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Next Button */}
        <button
          id="dock-next-btn"
          onClick={onNext}
          disabled={currentStep === totalSteps || isAutoRunning}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
        >
          <span className="hidden sm:inline">Bước tiếp: {nextStepTitle || 'Kế tiếp'}</span>
          <span className="sm:hidden">Tiếp theo</span>
          <ArrowRight className="w-4 h-4" />
          <kbd className="hidden md:inline px-1 py-0.5 text-[10px] bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-800 rounded">
            →
          </kbd>
        </button>
      </div>
    </div>
  );
};
