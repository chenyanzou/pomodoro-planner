import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
  const { toggle, reset, registerPhaseCompleteListener } = useTimerActions();

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
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] pb-20 text-[var(--text-primary)] md:pb-8">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {isDemoMode && (
        <div className="border-b border-[var(--accent-focus)]/25 bg-[var(--accent-focus-soft)]/80 px-4 py-2 text-center text-xs text-[var(--text-primary)]">
          <span>
            当前处于 <strong>演示模式</strong>：展示内置示例数据，可自由操作体验，退出后自动恢复你的个人本地数据。
          </span>
          <button
            type="button"
            onClick={exitDemoMode}
            className="focus-ring ml-2.5 inline-flex items-center rounded-lg bg-[var(--accent-focus)] px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-[var(--accent-focus-hover)]"
          >
            退出演示
          </button>
        </div>
      )}

      {activeTab === 'focus' && (
        <main className="mx-auto grid max-w-6xl gap-6 px-3.5 py-5 sm:px-6 sm:py-6 lg:grid-cols-12 lg:items-start">
          <div className="min-w-0 lg:col-span-5 lg:sticky lg:top-20">
            <TimerCard onEnterImmersive={() => setImmersive(true)} />
          </div>
          <div className="min-w-0 lg:col-span-7">
            <SchedulePanel
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              quickInputRef={quickInputRef}
            />
          </div>
        </main>
      )}

      {activeTab === 'goals' && <GoalsView onJumpToSchedule={handleJumpToSchedule} />}

      {activeTab === 'analytics' && (
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[var(--text-muted)] sm:px-6">
              正在加载复盘统计图表...
            </div>
          }
        >
          <AnalyticsView />
        </Suspense>
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
