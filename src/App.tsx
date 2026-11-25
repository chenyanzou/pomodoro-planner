import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { TimerProvider, useTimer } from './context/TimerContext';
import { Header, type ActiveTab } from './components/layout/Header';
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
} from './utils/audioEngine';
import { toLocalDateKey } from './utils/date';

const AnalyticsView = lazy(() => import('./components/analytics/AnalyticsView'));

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function AppShell() {
  const { state } = useAppData();
  const { toggle, reset, registerPhaseCompleteListener } = useTimer();

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

  // Global keyboard shortcuts (disabled when typing in inputs or when a modal is open)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableElement(e.target)) return;
      if (showSettings || showShortcuts) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        reset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setImmersive((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setImmersive(false);
        setActiveTab('focus');
        window.setTimeout(() => quickInputRef.current?.focus(), 30);
      } else if (e.key === '1') {
        setImmersive(false);
        setActiveTab('focus');
      } else if (e.key === '2') {
        setImmersive(false);
        setActiveTab('goals');
      } else if (e.key === '3') {
        setImmersive(false);
        setActiveTab('analytics');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, reset, showSettings, showShortcuts]);

  const handleJumpToSchedule = (dateKey: string) => {
    setSelectedDate(dateKey);
    setActiveTab('focus');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] pb-20 text-[var(--text-primary)] md:pb-8">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {activeTab === 'focus' && (
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <TimerCard onEnterImmersive={() => setImmersive(true)} />
          </div>
          <div className="lg:col-span-7">
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
