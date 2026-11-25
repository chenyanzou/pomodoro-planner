import type { AppSettings, PersistedTimerState, TimerPhase } from '../types';

export interface CompletedFocusPayload {
  startedAt: number;
  endedAt: number;
  durationMinutes: number;
  taskId: string | null;
}

export interface ReconcileResult {
  nextState: PersistedTimerState;
  completedFocus: CompletedFocusPayload | null;
  phaseEnded: TimerPhase | null;
}

export function getPhaseDurationSeconds(phase: TimerPhase, settings: AppSettings): number {
  if (phase === 'focus') return Math.max(1, Math.round(settings.focusMinutes)) * 60;
  if (phase === 'shortBreak') return Math.max(1, Math.round(settings.shortBreakMinutes)) * 60;
  return Math.max(1, Math.round(settings.longBreakMinutes)) * 60;
}

export function createInitialTimerState(settings: AppSettings): PersistedTimerState {
  const focusSeconds = getPhaseDurationSeconds('focus', settings);
  return {
    phase: 'focus',
    status: 'idle',
    remainingSeconds: focusSeconds,
    endTimestamp: null,
    startedAt: null,
    totalSeconds: focusSeconds,
    completedFocusCycles: 0,
    activeTaskId: null,
  };
}

export function getRemainingSeconds(state: PersistedTimerState, now: number): number {
  if (state.status === 'running' && state.endTimestamp !== null) {
    return Math.max(0, Math.ceil((state.endTimestamp - now) / 1000));
  }
  return Math.max(0, Math.round(state.remainingSeconds));
}

export function startTimer(state: PersistedTimerState, now: number): PersistedTimerState {
  if (state.status === 'running' && state.endTimestamp !== null) {
    return state;
  }
  const remaining = Math.max(1, Math.round(state.remainingSeconds));
  return {
    ...state,
    status: 'running',
    remainingSeconds: remaining,
    endTimestamp: now + remaining * 1000,
    startedAt: state.startedAt ?? now,
  };
}

export function pauseTimer(state: PersistedTimerState, now: number): PersistedTimerState {
  if (state.status !== 'running') return state;
  const remaining = getRemainingSeconds(state, now);
  return {
    ...state,
    status: 'paused',
    remainingSeconds: remaining,
    endTimestamp: null,
  };
}

export function resetTimer(state: PersistedTimerState, settings: AppSettings): PersistedTimerState {
  const duration = getPhaseDurationSeconds(state.phase, settings);
  return {
    ...state,
    status: 'idle',
    remainingSeconds: duration,
    totalSeconds: duration,
    endTimestamp: null,
    startedAt: null,
  };
}

export function switchTimerPhase(
  state: PersistedTimerState,
  phase: TimerPhase,
  settings: AppSettings,
): PersistedTimerState {
  const duration = getPhaseDurationSeconds(phase, settings);
  return {
    ...state,
    phase,
    status: 'idle',
    remainingSeconds: duration,
    totalSeconds: duration,
    endTimestamp: null,
    startedAt: null,
  };
}

export function reconcileTimerAt(
  state: PersistedTimerState,
  settings: AppSettings,
  now: number,
): ReconcileResult {
  if (state.status !== 'running' || state.endTimestamp === null) {
    return { nextState: state, completedFocus: null, phaseEnded: null };
  }

  const remaining = getRemainingSeconds(state, now);
  if (remaining > 0) {
    return { nextState: state, completedFocus: null, phaseEnded: null };
  }

  const finishedPhase = state.phase;
  const endedAt = state.endTimestamp;
  const startedAt = state.startedAt ?? endedAt - state.totalSeconds * 1000;

  if (finishedPhase === 'focus') {
    const nextCycles = state.completedFocusCycles + 1;
    const interval = Math.max(2, Math.round(settings.longBreakInterval));
    const nextPhase: TimerPhase = nextCycles % interval === 0 ? 'longBreak' : 'shortBreak';
    const nextDuration = getPhaseDurationSeconds(nextPhase, settings);

    let nextState: PersistedTimerState = {
      ...state,
      phase: nextPhase,
      status: 'idle',
      remainingSeconds: nextDuration,
      totalSeconds: nextDuration,
      endTimestamp: null,
      startedAt: null,
      completedFocusCycles: nextCycles,
    };

    if (settings.autoStartBreak) {
      nextState = startTimer(nextState, now);
    }

    return {
      nextState,
      phaseEnded: 'focus',
      completedFocus: {
        startedAt,
        endedAt,
        durationMinutes: Math.max(1, Math.round(state.totalSeconds / 60)),
        taskId: state.activeTaskId,
      },
    };
  }

  const nextDuration = getPhaseDurationSeconds('focus', settings);
  let nextState: PersistedTimerState = {
    ...state,
    phase: 'focus',
    status: 'idle',
    remainingSeconds: nextDuration,
    totalSeconds: nextDuration,
    endTimestamp: null,
    startedAt: null,
  };

  if (settings.autoStartFocus) {
    nextState = startTimer(nextState, now);
  }

  return {
    nextState,
    completedFocus: null,
    phaseEnded: finishedPhase,
  };
}
