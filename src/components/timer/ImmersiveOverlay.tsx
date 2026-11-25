import { useEffect } from 'react';
import { Minimize2, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatSecondsMMSS, useTimer } from '../../context/TimerContext';
import type { AmbientNoiseMode } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { BrandMark } from '../layout/Header';
import { FocusDial } from './FocusDial';
import { NOISE_MODES, PHASE_COPY } from './TimerCard';

interface ImmersiveOverlayProps {
  onClose: () => void;
}

const QUOTES = {
  focus: 'One tomato at a time.',
  break: 'Breathe. The work will wait.',
};

export function ImmersiveOverlay({ onClose }: ImmersiveOverlayProps) {
  const { state, updateSettings } = useAppData();
  const { timerState, remainingSeconds, progress, toggle, reset, skipPhase } = useTimer();

  const isFocus = timerState.phase === 'focus';
  const running = timerState.status === 'running';
  const accent = isFocus ? 'var(--accent-focus)' : 'var(--accent-break)';
  const copy = PHASE_COPY[timerState.phase];
  const activeTask = timerState.activeTaskId
    ? state.tasks.find((t) => t.id === timerState.activeTaskId)
    : undefined;
  const volPct = Math.round(((state.settings.ambientVolume - 0.05) / 0.95) * 100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="沉浸专注模式"
      data-theme="dark"
      className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#0d0c0a] px-5 py-6 text-[var(--text-primary)] sm:px-8 sm:py-8"
    >
      {/* Drifting ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="immersive-orb absolute -top-[20%] -left-[10%] h-[70vmax] w-[70vmax] rounded-full"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 26%, transparent), transparent 62%)` }}
        />
        <div
          className="immersive-orb immersive-orb--slow absolute -right-[15%] -bottom-[25%] h-[60vmax] w-[60vmax] rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent-gold) 16%, transparent), transparent 60%)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="relative flex w-full max-w-4xl items-center justify-between">
        <span className="inline-flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
          <BrandMark className="h-7 w-7" />
          <span className="font-serif-italic text-[15px]">{copy.eyebrow}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md transition hover:bg-white/10 hover:text-[var(--text-primary)]"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          退出沉浸
          <kbd className="kbd !h-5 !border-white/15 !bg-white/5 !text-[10px]">Esc</kbd>
        </button>
      </div>

      <div className="animate-scale-in relative flex flex-col items-center">
        <FocusDial
          progress={progress}
          isFocus={isFocus}
          running={running}
          tickCount={60}
          className="h-[300px] w-[300px] sm:h-[400px] sm:w-[400px]"
        >
          <span className="text-[11px] font-semibold tracking-[0.3em] text-[var(--text-muted)]">
            {copy.chip}
          </span>
          <div className="num-display mt-2 text-[76px] leading-none font-extralight sm:text-[104px]">
            {formatSecondsMMSS(remainingSeconds)}
          </div>
        </FocusDial>

        <p className="mt-7 max-w-md px-4 text-center text-lg font-medium tracking-wide text-[var(--text-primary)]">
          {activeTask ? activeTask.title : '心无旁骛，享受当下这一颗番茄'}
        </p>
        <p className="font-serif-italic mt-1.5 text-sm text-[var(--text-muted)]">
          {isFocus ? QUOTES.focus : QUOTES.break}
        </p>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            aria-label="重置计时"
            className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] backdrop-blur-md transition hover:bg-white/10 hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={running ? '暂停 (Space)' : '开始 (Space)'}
            data-tone={isFocus ? 'focus' : 'break'}
            className="focus-ring btn-primary h-16 w-16 rounded-full"
          >
            {running ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
          </button>
          <button
            type="button"
            onClick={skipPhase}
            aria-label="跳过当前阶段"
            className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] backdrop-blur-md transition hover:bg-white/10 hover:text-[var(--text-primary)]"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pr-4 pl-1.5 text-xs backdrop-blur-md">
        <Dropdown
          ariaLabel="切换沉浸模式白噪音"
          placement="top"
          value={state.settings.ambientNoise}
          options={NOISE_MODES}
          onChange={(v) => updateSettings({ ambientNoise: v as AmbientNoiseMode })}
          leading={
            state.settings.ambientNoise === 'off' ? (
              <VolumeX className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" style={{ color: accent }} />
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
            aria-label="调整白噪音音量"
            className="range w-24"
            style={{ ['--range-pct' as string]: `${volPct}%`, ['--range-color' as string]: accent }}
          />
        )}
        <span className="hidden items-center gap-1 text-[11px] text-[var(--text-muted)] sm:inline-flex">
          <kbd className="kbd !h-5 !border-white/15 !bg-white/5 !text-[10px]">Space</kbd> 开始 / 暂停
        </span>
      </div>
    </div>
  );
}
