import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { TimerProvider, useTimerActions } from './context/TimerContext';
import { Header, type ActiveTab } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { UndoToast } from './components/layout/UndoToast';
import { TimerCard } from './components/timer/TimerCard';
import { ImmersiveOverlay } from './components/timer/ImmersiveOverlay';
import { SchedulePanel } from './components/schedule/SchedulePanel';
import { GoalsView } from './components/goals/GoalsView';
import { SettingsModal } from './components/modals/SettingsModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import {
  playCompletionChime,
  setAmbientNoise,
  stopAmbientNoise,
  unlockAudioContext,
} from './utils/audioEngine';
import { toLocalDateKey } from './utils/date';

const AnalyticsView = lazy(() => import('./components/analytics/AnalyticsView'));

function isEditableOrInteractive(target: EventTarget | null, code: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
    return true;
  }
  // Never hijack Space when user is activating a focused button, link, or tab
  if (code === 'Space' && (tag === 'BUTTON' || tag === 'A' || target.getAttribute('role') === 'tab')) {
    return true;
  }
  return false;
}

function AppShell() {
  const { state, isDemoMode, exitDemoMode } = useAppData();
  const { toggle, reset, registerPhaseCompleteListener, phase, status } = useTimerActions();

  // Drive global phase ambience (ember glow for focus, sage glow for breaks) without tick subscriptions
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.phase = phase === 'focus' ? 'focus' : 'break';
    root.dataset.running = status === 'running' ? 'true' : 'false';
  }, [phase, status]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('focus');
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateKey());
  const [immersive, setImmersive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const quickInputRef = useRef<HTMLInputElement | null>(null);

  // Sync Web Audio ambient noise with settings
  useEffect(() => {
    setAmbientNoise(state.settings.ambientNoise, state.settings.ambientVolume);
  }, [state.settings.ambientNoise, state.settings.ambientVolume]);

  // If ambient noise was persisted across reload, resume suspended AudioContext on first user gesture
  useEffect(() => {
    if (state.settings.ambientNoise === 'off') return;
    const unlock = () => unlockAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [state.settings.ambientNoise]);

  useEffect(() => () => stopAmbientNoise(), []);

  // Play Web Audio chime & dispatch browser notification on phase completion
  useEffect(() => {
    return registerPhaseCompleteListener((finishedPhase) => {
      if (state.settings.soundEnabled) {
        playCompletionChime(state.settings.soundVolume);
      }
      if (
        state.settings.notificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const title = finishedPhase === 'focus' ? '🍅 专注完成！' : '🌿 休息结束';
        const body =
          finishedPhase === 'focus'
            ? '已完成 1 个番茄并写入复盘记录，起来伸展一下吧。'
            : '精力已恢复，准备开启下一轮专注吧。';
        try {
          new Notification(title, { body });
        } catch {
          // Ignore environments blocking Notification constructor
        }
      }
    });
  }, [
    registerPhaseCompleteListener,
    state.settings.soundEnabled,
    state.settings.soundVolume,
    state.settings.notificationsEnabled,
  ]);

  // Global keyboard shortcuts (suspended inside editable fields and while non-immersive modals are open)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableOrInteractive(e.target, e.code)) return;

      const openDialogs = document.querySelectorAll('[role="dialog"]');
      const hasNonImmersiveModal =
        showSettings || showShortcuts || (!immersive && openDialogs.length > 0);
      if (hasNonImmersiveModal) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        reset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setImmersive((prev) => !prev);
      } else if (!immersive && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveTab('focus');
        window.setTimeout(() => quickInputRef.current?.focus(), 30);
      } else if (!immersive && e.key === '1') {
        setActiveTab('focus');
      } else if (!immersive && e.key === '2') {
        setActiveTab('goals');
      } else if (!immersive && e.key === '3') {
        setActiveTab('analytics');
      } else if (!immersive && e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, reset, immersive, showSettings, showShortcuts]);

  const handleJumpToSchedule = (dateKey: string) => {
    setSelectedDate(dateKey);
    setActiveTab('focus');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24 text-[var(--text-primary)] md:pb-10">
      <div aria-hidden="true" className="cinema-vignette" />
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {isDemoMode && (
        <div className="animate-fade-in mx-auto max-w-6xl px-3.5 pt-3.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--accent-gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-gold)_10%,var(--bg-surface))] px-4 py-2 text-xs text-[var(--text-secondary)]">
            <span className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-gold)]" />
              <span>
                <strong className="font-semibold text-[var(--text-primary)]">演示模式</strong>
                <span className="mx-1.5 text-[var(--border-strong)]">·</span>
                内置示例数据可自由操作体验，退出后自动恢复你的个人本地数据。
              </span>
            </span>
            <button
              type="button"
              onClick={exitDemoMode}
              className="focus-ring shrink-0 font-medium text-[var(--accent-focus)] underline-offset-4 hover:underline"
            >
              恢复我的数据 →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <main
          key="focus"
          className="view-enter mx-auto grid max-w-6xl gap-5 px-3.5 py-5 sm:px-6 sm:py-7 lg:grid-cols-12 lg:items-start lg:gap-6"
        >
          <div className="min-w-0 lg:col-span-5 lg:sticky lg:top-24">
            <TimerCard onEnterImmersive={() => setImmersive(true)} />
          </div>
          <div className="cinema-companion min-w-0 lg:col-span-7">
            <SchedulePanel
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              quickInputRef={quickInputRef}
            />
          </div>
        </main>
      )}

      {activeTab === 'goals' && (
        <div key="goals" className="view-enter">
          <GoalsView onJumpToSchedule={handleJumpToSchedule} />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div key="analytics" className="view-enter">
          <Suspense
            fallback={
              <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-20 text-center text-sm text-[var(--text-muted)] sm:px-6">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent-focus)]" />
                正在加载复盘统计…
              </div>
            }
          >
            <AnalyticsView />
          </Suspense>
        </div>
      )}

      {immersive && <ImmersiveOverlay onClose={() => setImmersive(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />
      <UndoToast />
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <TimerProvider>
        <AppShell />
      </TimerProvider>
    </AppDataProvider>
  );
}
