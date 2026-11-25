import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Target,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatSecondsMMSS, useTimer } from '../../context/TimerContext';
import type { AmbientNoiseMode, TimerPhase } from '../../types';

interface TimerCardProps {
  onEnterImmersive: () => void;
}

const PHASE_TABS: Array<{ key: TimerPhase; label: string }> = [
  { key: 'focus', label: '专注' },
  { key: 'shortBreak', label: '短休' },
  { key: 'longBreak', label: '长休' },
];

const NOISE_MODES: Array<{ value: AmbientNoiseMode; label: string }> = [
  { value: 'off', label: '关闭白噪音' },
  { value: 'rain', label: '细雨声' },
  { value: 'pink', label: '柔和粉噪' },
  { value: 'brown', label: '暖壁炉低噪' },
];

export function TimerCard({ onEnterImmersive }: TimerCardProps) {
  const { state, updateSettings } = useAppData();
  const { timerState, remainingSeconds, progress, toggle, reset, skipPhase, switchPhase, bindTask } =
    useTimer();

  const isFocus = timerState.phase === 'focus';
  const accentColor = isFocus ? 'var(--accent-focus)' : 'var(--accent-break)';
  const accentSoft = isFocus ? 'var(--accent-focus-soft)' : 'var(--accent-break-soft)';
  const activeTask = timerState.activeTaskId
    ? state.tasks.find((t) => t.id === timerState.activeTaskId)
    : undefined;

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const interval = Math.max(2, state.settings.longBreakInterval);
  const currentCycleIndex = timerState.completedFocusCycles % interval;

  return (
    <section
      aria-label="番茄钟专注计时器"
      className="paper-card flex flex-col items-center rounded-3xl p-6 sm:p-8"
    >
      <div
        role="tablist"
        aria-label="计时阶段"
        className="inline-flex rounded-2xl bg-[var(--bg-subtle)] p-1"
      >
        {PHASE_TABS.map((tab) => {
          const active = timerState.phase === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchPhase(tab.key)}
              className={`focus-ring rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative my-7 flex h-60 w-60 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth="8"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: accentSoft, color: accentColor }}
          >
            {isFocus ? '专注时段' : timerState.phase === 'shortBreak' ? '短暂休息' : '深度长休'}
          </span>
          <div className="tabular-nums mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">
            {formatSecondsMMSS(remainingSeconds)}
          </div>
          <div
            className="mt-3 flex items-center gap-1.5"
            aria-label={`本轮周期 ${currentCycleIndex}/${interval}`}
          >
            {Array.from({ length: interval }).map((_, idx) => (
              <span
                key={idx}
                className="h-2 w-2 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    idx < currentCycleIndex ? accentColor : 'var(--border-strong)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex w-full items-center justify-center">
        {activeTask ? (
          <div className="flex max-w-full items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 px-3.5 py-2 text-sm">
            <Target className="h-4 w-4 shrink-0 text-[var(--accent-focus)]" />
            <span className="truncate font-medium">{activeTask.title}</span>
            <span className="tabular-nums shrink-0 text-xs text-[var(--text-muted)]">
              {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros}
            </span>
            <button
              type="button"
              onClick={() => bindTask(null)}
              aria-label="解除绑定任务"
              className="focus-ring ml-1 rounded-lg p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-muted)]">
            点击计划表中任务的 ▶ 按钮即可绑定专注目标
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          title="重置计时 (R)"
          aria-label="重置当前计时"
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggle}
          style={{ backgroundColor: accentColor }}
          className="focus-ring flex h-12 min-w-[148px] items-center justify-center gap-2 rounded-2xl px-6 text-base font-medium text-white shadow-xs transition hover:opacity-95 active:scale-[0.98]"
        >
          {timerState.status === 'running' ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              {timerState.status === 'paused' ? '继续专注' : '开始专注'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={skipPhase}
          title="跳过当前阶段"
          aria-label="跳过当前阶段"
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Ambient Sound & Fullscreen Immersive Bar */}
      <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs">
        <div className="flex items-center gap-2">
          {state.settings.ambientNoise === 'off' ? (
            <VolumeX className="h-4 w-4 text-[var(--text-muted)]" />
          ) : (
            <Volume2 className="h-4 w-4 text-[var(--accent-focus)]" />
          )}
          <select
            value={state.settings.ambientNoise}
            onChange={(e) =>
              updateSettings({ ambientNoise: e.target.value as AmbientNoiseMode })
            }
            aria-label="环境白噪音选择"
            className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)]"
          >
            {NOISE_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
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
              aria-label="白噪音音量"
              className="w-16 accent-[var(--accent-focus)]"
            />
          )}
        </div>

        <button
          type="button"
          onClick={onEnterImmersive}
          title="全屏沉浸模式 (F)"
          className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3 py-1.5 font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          沉浸模式
        </button>
      </div>
    </section>
  );
}
