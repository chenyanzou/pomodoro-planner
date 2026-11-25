import { useEffect } from 'react';
import { Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatSecondsMMSS, useTimer } from '../../context/TimerContext';
import type { AmbientNoiseMode } from '../../types';

interface ImmersiveOverlayProps {
  onClose: () => void;
}

const NOISE_OPTIONS: Array<{ value: AmbientNoiseMode; label: string }> = [
  { value: 'off', label: '关闭白噪音' },
  { value: 'rain', label: '细雨声' },
  { value: 'pink', label: '柔和粉噪' },
  { value: 'brown', label: '暖壁炉低噪' },
];

export function ImmersiveOverlay({ onClose }: ImmersiveOverlayProps) {
  const { state, updateSettings } = useAppData();
  const { timerState, remainingSeconds, progress, toggle, reset } = useTimer();

  const isFocus = timerState.phase === 'focus';
  const accentColor = isFocus ? 'var(--accent-focus)' : 'var(--accent-break)';
  const activeTask = timerState.activeTaskId
    ? state.tasks.find((t) => t.id === timerState.activeTaskId)
    : undefined;

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="沉浸专注模式"
      className="animate-fade-up fixed inset-0 z-50 flex flex-col items-center justify-between bg-[var(--bg-canvas)] px-6 py-8"
    >
      <div className="flex w-full max-w-3xl items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          🍅 番茄计划 · 沉浸专注模式
        </span>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          退出沉浸 (Esc)
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 320 320" aria-hidden="true">
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="var(--bg-subtle)"
              strokeWidth="10"
            />
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">
              {isFocus ? '深度专注' : timerState.phase === 'shortBreak' ? '短暂休息' : '深度长休'}
            </span>
            <div className="tabular-nums mt-2 text-6xl font-semibold tracking-tight sm:text-7xl">
              {formatSecondsMMSS(remainingSeconds)}
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-md text-center text-base font-medium text-[var(--text-primary)]">
          {activeTask ? activeTask.title : '心无旁骛，享受当下这一颗番茄'}
        </p>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            aria-label="重置计时"
            className="focus-ring flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            style={{ backgroundColor: accentColor }}
            className="focus-ring flex h-13 min-w-[168px] items-center justify-center gap-2 rounded-2xl px-8 text-base font-medium text-white shadow-sm transition hover:opacity-95"
          >
            {timerState.status === 'running' ? (
              <>
                <Pause className="h-4 w-4 fill-current" /> 暂停 (Space)
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> 开始 (Space)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs">
        {state.settings.ambientNoise === 'off' ? (
          <VolumeX className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <Volume2 className="h-4 w-4 text-[var(--accent-focus)]" />
        )}
        <select
          value={state.settings.ambientNoise}
          onChange={(e) => updateSettings({ ambientNoise: e.target.value as AmbientNoiseMode })}
          aria-label="切换沉浸模式白噪音"
          className="focus-ring rounded-lg bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-primary)]"
        >
          {NOISE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {state.settings.ambientNoise !== 'off' && (
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={state.settings.ambientVolume}
            onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) })}
            aria-label="调整白噪音音量"
            className="w-24 accent-[var(--accent-focus)]"
          />
        )}
      </div>
    </div>
  );
}
