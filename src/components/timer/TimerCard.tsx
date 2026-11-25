import { Maximize2, Pause, Play, RotateCcw, SkipForward, Target, Volume2, VolumeX, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatSecondsMMSS, useTimer } from '../../context/TimerContext';
import type { AmbientNoiseMode, TimerPhase } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Dropdown } from '../ui/Dropdown';
import { FocusDial } from './FocusDial';

interface TimerCardProps {
  onEnterImmersive: () => void;
}

const PHASE_TABS: Array<{ value: TimerPhase; label: string }> = [
  { value: 'focus', label: '专注' },
  { value: 'shortBreak', label: '短休' },
  { value: 'longBreak', label: '长休' },
];

export const NOISE_MODES: Array<{ value: AmbientNoiseMode; label: string }> = [
  { value: 'off', label: '白噪音 · 关闭' },
  { value: 'rain', label: '细雨声' },
  { value: 'pink', label: '柔和粉噪' },
  { value: 'brown', label: '暖壁炉低噪' },
];

export const PHASE_COPY: Record<TimerPhase, { chip: string; eyebrow: string; idle: string }> = {
  focus: { chip: '专注时段', eyebrow: 'Deep Focus', idle: '准备好就开始吧' },
  shortBreak: { chip: '短暂休息', eyebrow: 'Short Break', idle: '起身喝口水' },
  longBreak: { chip: '深度长休', eyebrow: 'Long Break', idle: '走一走，看看远方' },
};

export function TimerCard({ onEnterImmersive }: TimerCardProps) {
  const { state, updateSettings } = useAppData();
  const { timerState, remainingSeconds, progress, toggle, reset, skipPhase, switchPhase, bindTask } = useTimer();

  const isFocus = timerState.phase === 'focus';
  const running = timerState.status === 'running';
  const accentColor = isFocus ? 'var(--accent-focus)' : 'var(--accent-break)';
  const accentSoft = isFocus ? 'var(--accent-focus-soft)' : 'var(--accent-break-soft)';
  const copy = PHASE_COPY[timerState.phase];
  const activeTask = timerState.activeTaskId
    ? state.tasks.find((t) => t.id === timerState.activeTaskId)
    : undefined;

  const interval = Math.max(2, state.settings.longBreakInterval);
  const currentCycleIndex = timerState.completedFocusCycles % interval;
  const volPct = Math.round(((state.settings.ambientVolume - 0.05) / 0.95) * 100);

  return (
    <section aria-label="番茄钟专注计时器" className="paper-card cinema-stage overflow-hidden rounded-[28px]">
      {/* Subtle 35mm viewfinder corner hairlines (light mode only) */}
      <span aria-hidden="true" className="cinema-corner top-3 left-3 rounded-tl-[4px] border-t border-l" />
      <span aria-hidden="true" className="cinema-corner top-3 right-3 rounded-tr-[4px] border-t border-r" />
      <span aria-hidden="true" className="cinema-corner bottom-3 left-3 rounded-bl-[4px] border-b border-l" />
      <span aria-hidden="true" className="cinema-corner right-3 bottom-3 rounded-br-[4px] border-r border-b" />

      {/* phase wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 transition-[background] duration-1000"
        style={{
          background: `radial-gradient(85% 100% at 50% -6%, color-mix(in srgb, ${accentColor} 18%, transparent), transparent 72%)`,
        }}
      />

      <div className="relative flex flex-col items-center px-5 pt-5 pb-5 sm:px-7 sm:pt-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full transition-colors ${running ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: accentColor }}
            />
            <span className="eyebrow text-[10px]">REEL 0{currentCycleIndex + 1}</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="font-serif-italic text-[13px] text-[var(--text-muted)]">{copy.eyebrow}</span>
          </div>
          <button
            type="button"
            onClick={onEnterImmersive}
            title="全屏沉浸模式 (F)"
            aria-label="进入沉浸模式"
            className="focus-ring btn-soft h-8 px-2.5 text-[11.5px]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>影院沉浸</span>
          </button>
        </div>

        <SegmentedControl
          asTabs
          size="md"
          ariaLabel="计时阶段"
          value={timerState.phase}
          options={PHASE_TABS}
          onChange={switchPhase}
          className="mt-2"
        />

        <FocusDial
          progress={progress}
          isFocus={isFocus}
          running={running}
          className="my-6 h-[264px] w-[264px] sm:h-[288px] sm:w-[288px]"
        >
          <span
            className="chip transition-colors duration-500"
            style={{ backgroundColor: accentSoft, color: accentColor }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: accentColor }}
            />
            {copy.chip}
          </span>
          <div
            className="num-display mt-1.5 text-[60px] leading-none font-light text-[var(--text-primary)] sm:text-[68px]"
            aria-live="off"
          >
            {formatSecondsMMSS(remainingSeconds)}
          </div>
          <div className="mt-3 flex items-center gap-1.5" aria-label={`本轮周期 ${currentCycleIndex}/${interval}`}>
            {Array.from({ length: interval }).map((_, idx) => (
              <span
                key={idx}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: idx < currentCycleIndex ? 14 : 6,
                  backgroundColor: idx < currentCycleIndex ? accentColor : 'var(--border-strong)',
                }}
              />
            ))}
          </div>
          <span className="mt-2 text-[11px] text-[var(--text-muted)]">
            {running
              ? isFocus
                ? `第 ${currentCycleIndex + 1} / ${interval} 颗番茄`
                : '放松一下，马上回来'
              : copy.idle}
          </span>
        </FocusDial>

        {/* Bound task */}
        <div className="mb-5 flex min-h-[40px] w-full items-center justify-center">
          {activeTask ? (
            <div className="animate-scale-in flex max-w-full items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 pr-1.5 pl-2 text-sm shadow-[var(--shadow-card)]">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentSoft, color: accentColor }}
              >
                <Target className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 truncate font-medium">{activeTask.title}</span>
              <span className="num-display shrink-0 rounded-lg bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[11px] !tracking-normal text-[var(--text-secondary)]">
                {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros}
              </span>
              <button
                type="button"
                onClick={() => bindTask(null)}
                aria-label="解除绑定任务"
                className="focus-ring rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-center text-xs text-[var(--text-muted)]">
              点击计划任务上的
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--accent-focus)]">
                <Play className="h-2.5 w-2.5 fill-current" />
              </span>
              绑定专注目标
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            title="重置计时 (R)"
            aria-label="重置当前计时"
            className="focus-ring icon-btn h-11 w-11 rounded-2xl"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggle}
            data-tone={isFocus ? 'focus' : 'break'}
            className="focus-ring btn-primary h-12 min-w-[156px] rounded-2xl px-6 text-[15px]"
          >
            {running ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                暂停
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                {timerState.status === 'paused' ? '继续' : isFocus ? '开始专注' : '开始休息'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={skipPhase}
            title="跳过当前阶段"
            aria-label="跳过当前阶段"
            className="focus-ring icon-btn h-11 w-11 rounded-2xl"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ambient footer */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_40%,transparent)] px-5 py-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <Dropdown
            ariaLabel="环境白噪音选择"
            value={state.settings.ambientNoise}
            options={NOISE_MODES}
            onChange={(v) => updateSettings({ ambientNoise: v as AmbientNoiseMode })}
            leading={
              state.settings.ambientNoise === 'off' ? (
                <VolumeX className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
              )
            }
          />
          {state.settings.ambientNoise !== 'off' && (
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={state.settings.ambientVolume}
              onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) })}
              aria-label="白噪音音量"
              className="range animate-fade-in w-20"
              style={{ ['--range-pct' as string]: `${volPct}%` }}
            />
          )}
        </div>
        <span className="hidden items-center gap-1 text-[11px] text-[var(--text-muted)] sm:inline-flex">
          <kbd className="kbd">Space</kbd> 开始/暂停
        </span>
      </div>
    </section>
  );
}
