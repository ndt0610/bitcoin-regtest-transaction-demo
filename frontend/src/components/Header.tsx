import React from 'react';
import { Sun, Moon, Monitor, Cpu, Sparkles, CheckCircle2, AlertCircle, Compass, Layers, FileText } from 'lucide-react';
import { ThemeMode, ViewMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isBackendConnected: boolean;
  isSandboxMode: boolean;
  onToggleSandbox: (val: boolean) => void;
  onOpenEvaluation: () => void;
  onOpenExpertReport: () => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  currentStep: number;
  totalSteps: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  isBackendConnected,
  isSandboxMode,
  onToggleSandbox,
  onOpenEvaluation,
  onOpenExpertReport,
  viewMode,
  onToggleViewMode,
  currentStep,
  totalSteps
}) => {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md transition-colors">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-lg tracking-wider">
            ₿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Bitcoin Core Regtest
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                REGTEST
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 hidden sm:block">
              Trực quan hóa 9 bước vòng đời giao dịch Bitcoin Core
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View mode switcher */}
          <div className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              id="view-mode-stepper-btn"
              onClick={() => onToggleViewMode('stepper')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'stepper'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Từng Bước</span>
            </button>
            <button
              id="view-mode-pipeline-btn"
              onClick={() => onToggleViewMode('pipeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Toàn Cảnh</span>
            </button>
          </div>

          {/* Engine Mode Toggle */}
          <button
            id="engine-toggle-btn"
            onClick={() => onToggleSandbox(!isSandboxMode)}
            title={isSandboxMode ? "Đang chạy chế độ mô phỏng Sandbox. Bấm để thử kết nối FastAPI :8000" : "Đang thử kết nối FastAPI :8000. Bấm để chuyển sang Sandbox"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Nguồn:</span>
            {isSandboxMode ? (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Sandbox Demo
              </span>
            ) : isBackendConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                API 8000 Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                Offline
              </span>
            )}
          </button>

          {/* Expert Markdown Report Button */}
          <button
            id="expert-report-btn"
            onClick={onOpenExpertReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 transition-colors shadow-xs cursor-pointer"
            title="Xem báo cáo phân tích thuật toán toàn diện dạng Markdown"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-bold">Báo Cáo MD</span>
          </button>

          {/* Evaluation & UX Insights Button */}
          <button
            id="evaluation-btn"
            onClick={onOpenEvaluation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Đánh Giá UX</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              id="theme-light-btn"
              onClick={() => onThemeChange('light')}
              title="Chế độ Sáng"
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              id="theme-dark-btn"
              onClick={() => onThemeChange('dark')}
              title="Chế độ Tối (Dark Mode)"
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-700 text-amber-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              id="theme-system-btn"
              onClick={() => onThemeChange('system')}
              title="Theo Hệ Thống"
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'system'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
