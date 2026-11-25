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

interface TimerContextValue {
  timerState: PersistedTimerState;
  remainingSeconds: number;
  progress: number;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skipPhase: () => void;
  switchPhase: (phase: TimerPhase) => void;
  bindTask: (taskId: string | null) => void;
  registerPhaseCompleteListener: (cb: (phase: TimerPhase) => void) => () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

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
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
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

  // Core reconciliation loop (drift-free via endTimestamp + visibilitychange)
  const checkReconcile = useCallback(
    (currentNow: number) => {
      setTimerState((prev) => {
        if (prev.status !== 'running' || prev.endTimestamp === null) return prev;
        const result = reconcileTimerAt(prev, settings, currentNow);
        if (!result.phaseEnded) return prev;

        if (lastCompletedEndTsRef.current !== prev.endTimestamp) {
          lastCompletedEndTsRef.current = prev.endTimestamp;
          if (result.completedFocus) {
            completeBoundFocusSession(result.completedFocus);
            const wasOffline = currentNow - prev.endTimestamp > 5000;
            showToast(
              wasOffline
                ? `刚才的 ${result.completedFocus.durationMinutes} 分钟专注已自动完成并记录`
                : `完成 1 个番茄（${result.completedFocus.durationMinutes} 分钟），休息一下吧`,
            );
          } else {
            showToast('休息结束，准备好开启下一轮专注了吗？');
          }
          phaseListenersRef.current.forEach((cb) => cb(result.phaseEnded!));
        }

        return result.nextState;
      });
    },
    [completeBoundFocusSession, settings, showToast],
  );

  // Run reconciliation immediately on mount (handles offline completion after reload)
  useEffect(() => {
    const t = Date.now();
    setNowMs(t);
    checkReconcile(t);
  }, [checkReconcile]);

  useEffect(() => {
    if (timerState.status !== 'running') return;
    const tick = () => {
      const t = Date.now();
      setNowMs(t);
      checkReconcile(t);
    };
    const interval = window.setInterval(tick, 250);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [timerState.status, checkReconcile]);

  const remainingSeconds = getRemainingSeconds(timerState, nowMs);
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
    const t = Date.now();
    setNowMs(t);
    setTimerState((prev) => startTimer(prev, t));
  }, []);

  const pause = useCallback(() => {
    const t = Date.now();
    setNowMs(t);
    setTimerState((prev) => pauseTimer(prev, t));
  }, []);

  const toggle = useCallback(() => {
    const t = Date.now();
    setNowMs(t);
    setTimerState((prev) =>
      prev.status === 'running' ? pauseTimer(prev, t) : startTimer(prev, t),
    );
  }, []);

  const reset = useCallback(() => {
    setTimerState((prev) => resetTimer(prev, settings));
  }, [settings]);

  const switchPhase = useCallback(
    (phase: TimerPhase) => {
      setTimerState((prev) => switchTimerPhase(prev, phase, settings));
    },
    [settings],
  );

  const skipPhase = useCallback(() => {
    setTimerState((prev) => {
      const nextPhase: TimerPhase =
        prev.phase === 'focus'
          ? (prev.completedFocusCycles + 1) % Math.max(2, settings.longBreakInterval) === 0
            ? 'longBreak'
            : 'shortBreak'
          : 'focus';
      return switchTimerPhase(prev, nextPhase, settings);
    });
  }, [settings]);

  const bindTask = useCallback((taskId: string | null) => {
    setTimerState((prev) => ({ ...prev, activeTaskId: taskId }));
  }, []);

  const value = useMemo<TimerContextValue>(
    () => ({
      timerState,
      remainingSeconds,
      progress,
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
      timerState,
      remainingSeconds,
      progress,
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

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider');
  return ctx;
}
