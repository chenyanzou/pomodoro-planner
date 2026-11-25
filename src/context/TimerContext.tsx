import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PersistedTimerState, TimerPhase } from '../types';
import { unlockAudioContext } from '../utils/audioEngine';
import { loadTimerState, saveTimerState } from '../utils/storage';
import {
  getPhaseDurationSeconds,
  getRemainingSeconds,
  pauseTimer,
  reconcileTimerAt,
  resetTimer,
  startTimer,
  switchTimerPhase,
} from '../utils/timerEngine';
import { useAppData } from './AppDataContext';

interface TimerActionsContextValue {
  activeTaskId: string | null;
  status: PersistedTimerState['status'];
  phase: TimerPhase;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skipPhase: () => void;
  switchPhase: (phase: TimerPhase) => void;
  bindTask: (taskId: string | null) => void;
  registerPhaseCompleteListener: (cb: (phase: TimerPhase) => void) => () => void;
}

interface TimerTickContextValue extends TimerActionsContextValue {
  timerState: PersistedTimerState;
  remainingSeconds: number;
  progress: number;
}

const TimerActionsContext = createContext<TimerActionsContextValue | null>(null);
const TimerTickContext = createContext<TimerTickContextValue | null>(null);

const PHASE_LABELS: Record<TimerPhase, string> = {
  focus: '专注中',
  shortBreak: '短休中',
  longBreak: '长休中',
};

export function formatSecondsMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { state, completeBoundFocusSession, showToast } = useAppData();
  const { settings, tasks } = state;

  const [timerState, setTimerState] = useState<PersistedTimerState>(() =>
    loadTimerState(settings),
  );
  const timerStateRef = useRef<PersistedTimerState>(timerState);
  timerStateRef.current = timerState;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    getRemainingSeconds(timerState, Date.now()),
  );

  const lastCompletedEndTsRef = useRef<number | null>(null);
  const phaseListenersRef = useRef<Set<(phase: TimerPhase) => void>>(new Set());

  const registerPhaseCompleteListener = useCallback((cb: (phase: TimerPhase) => void) => {
    phaseListenersRef.current.add(cb);
    return () => {
      phaseListenersRef.current.delete(cb);
    };
  }, []);

  // Persist timer state separately from domain data
  useEffect(() => {
    saveTimerState(timerState);
    setRemainingSeconds(getRemainingSeconds(timerState, Date.now()));
  }, [timerState]);

  // If idle and user changes durations in settings, sync duration cleanly
  useEffect(() => {
    setTimerState((prev) => {
      if (prev.status !== 'idle') return prev;
      const expected = getPhaseDurationSeconds(prev.phase, settings);
      if (prev.totalSeconds === expected && prev.remainingSeconds === expected) return prev;
      return {
        ...prev,
        totalSeconds: expected,
        remainingSeconds: expected,
      };
    });
  }, [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
  ]);

  // Unbind deleted task without interrupting running timer
  useEffect(() => {
    if (!timerState.activeTaskId) return;
    if (!tasks.some((t) => t.id === timerState.activeTaskId)) {
      setTimerState((prev) =>
        prev.activeTaskId ? { ...prev, activeTaskId: null } : prev,
      );
    }
  }, [tasks, timerState.activeTaskId]);

  // Reconcile outside setState updater so cross-context updates & audio never run in render phase
  const runReconcile = useCallback(
    (currentNow: number) => {
      const current = timerStateRef.current;
      if (current.status !== 'running' || current.endTimestamp === null) return;

      const nextRem = getRemainingSeconds(current, currentNow);
      setRemainingSeconds((prev) => (prev === nextRem ? prev : nextRem));

      const result = reconcileTimerAt(current, settingsRef.current, currentNow);
      if (!result.phaseEnded) return;
      if (lastCompletedEndTsRef.current === current.endTimestamp) return;

      lastCompletedEndTsRef.current = current.endTimestamp;
      timerStateRef.current = result.nextState;
      setTimerState(result.nextState);
      setRemainingSeconds(getRemainingSeconds(result.nextState, currentNow));

      if (result.completedFocus) {
        completeBoundFocusSession(result.completedFocus);
        const wasOffline = currentNow - current.endTimestamp > 5000;
        showToast(
          wasOffline
            ? `刚才的 ${result.completedFocus.durationMinutes} 分钟专注已自动完成并记录`
            : `完成 1 个番茄（${result.completedFocus.durationMinutes} 分钟），休息一下吧`,
        );
      } else {
        showToast('休息结束，准备好开启下一轮专注了吗？');
      }

      phaseListenersRef.current.forEach((cb) => cb(result.phaseEnded!));
    },
    [completeBoundFocusSession, showToast],
  );

  // Reconcile once on mount (handles offline completion after reload)
  useEffect(() => {
    runReconcile(Date.now());
  }, [runReconcile]);

  useEffect(() => {
    if (timerState.status !== 'running') return;
    const tick = () => runReconcile(Date.now());
    const interval = window.setInterval(tick, 250);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [timerState.status, runReconcile]);

  const progress =
    timerState.totalSeconds > 0
      ? Math.min(1, Math.max(0, 1 - remainingSeconds / timerState.totalSeconds))
      : 0;

  // Sync browser tab title while running
  useEffect(() => {
    if (timerState.status === 'running') {
      document.title = `${formatSecondsMMSS(remainingSeconds)} · ${PHASE_LABELS[timerState.phase]} - 番茄计划`;
    } else if (timerState.status === 'paused') {
      document.title = `已暂停 ${formatSecondsMMSS(remainingSeconds)} - 番茄计划`;
    } else {
      document.title = '番茄计划 · Pomodoro Planner';
    }
    return () => {
      document.title = '番茄计划 · Pomodoro Planner';
    };
  }, [timerState.status, timerState.phase, remainingSeconds]);

  const start = useCallback(() => {
    unlockAudioContext();
    const t = Date.now();
    setTimerState((prev) => startTimer(prev, t));
  }, []);

  const pause = useCallback(() => {
    const t = Date.now();
    setTimerState((prev) => pauseTimer(prev, t));
  }, []);

  const toggle = useCallback(() => {
    unlockAudioContext();
    const t = Date.now();
    setTimerState((prev) =>
      prev.status === 'running' ? pauseTimer(prev, t) : startTimer(prev, t),
    );
  }, []);

  const reset = useCallback(() => {
    setTimerState((prev) => resetTimer(prev, settingsRef.current));
  }, []);

  const switchPhase = useCallback((phase: TimerPhase) => {
    setTimerState((prev) => switchTimerPhase(prev, phase, settingsRef.current));
  }, []);

  const skipPhase = useCallback(() => {
    setTimerState((prev) => {
      const s = settingsRef.current;
      const nextPhase: TimerPhase =
        prev.phase === 'focus'
          ? (prev.completedFocusCycles + 1) % Math.max(2, s.longBreakInterval) === 0
            ? 'longBreak'
            : 'shortBreak'
          : 'focus';
      return switchTimerPhase(prev, nextPhase, s);
    });
  }, []);

  const bindTask = useCallback((taskId: string | null) => {
    setTimerState((prev) => ({ ...prev, activeTaskId: taskId }));
  }, []);

  // Low-frequency context: only updates when activeTaskId or status changes, never on 1s ticks
  const actionsValue = useMemo<TimerActionsContextValue>(
    () => ({
      activeTaskId: timerState.activeTaskId,
      status: timerState.status,
      phase: timerState.phase,
      start,
      pause,
      toggle,
      reset,
      skipPhase,
      switchPhase,
      bindTask,
      registerPhaseCompleteListener,
    }),
    [
      timerState.activeTaskId,
      timerState.status,
      timerState.phase,
      start,
      pause,
      toggle,
      reset,
      skipPhase,
      switchPhase,
      bindTask,
      registerPhaseCompleteListener,
    ],
  );

  // High-frequency context: consumed only by TimerCard & ImmersiveOverlay
  const tickValue = useMemo<TimerTickContextValue>(
    () => ({
      ...actionsValue,
      timerState,
      remainingSeconds,
      progress,
    }),
    [actionsValue, timerState, remainingSeconds, progress],
  );

  return (
    <TimerActionsContext.Provider value={actionsValue}>
      <TimerTickContext.Provider value={tickValue}>{children}</TimerTickContext.Provider>
    </TimerActionsContext.Provider>
  );
}

export function useTimerActions(): TimerActionsContextValue {
  const ctx = useContext(TimerActionsContext);
  if (!ctx) throw new Error('useTimerActions must be used inside TimerProvider');
  return ctx;
}

export function useTimer(): TimerTickContextValue {
  const ctx = useContext(TimerTickContext);
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider');
  return ctx;
}
