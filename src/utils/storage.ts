import type { AppSettings, FocusSession, Goal, PersistedAppState, PersistedTimerState, Task, TimerPhase } from '../types';
import { createEmptyAppState, DEFAULT_SETTINGS } from './seedData';
import { createInitialTimerState, getPhaseDurationSeconds } from './timerEngine';
import { validateGoal, validateSession, validateTask } from './validators';

export { DEFAULT_SETTINGS };

export const STATE_STORAGE_KEY = 'pomodoro_planner_state_v1';
export const TIMER_STORAGE_KEY = 'pomodoro_planner_timer_v1';

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const s = raw as Partial<AppSettings>;
  const ambientNoise =
    s.ambientNoise === 'rain' || s.ambientNoise === 'pink' || s.ambientNoise === 'brown'
      ? s.ambientNoise
      : 'off';
  const theme = s.theme === 'dark' || s.theme === 'system' ? s.theme : 'light';

  return {
    focusMinutes: Math.round(clamp(s.focusMinutes ?? DEFAULT_SETTINGS.focusMinutes, 1, 120, 25)),
    shortBreakMinutes: Math.round(
      clamp(s.shortBreakMinutes ?? DEFAULT_SETTINGS.shortBreakMinutes, 1, 60, 5),
    ),
    longBreakMinutes: Math.round(
      clamp(s.longBreakMinutes ?? DEFAULT_SETTINGS.longBreakMinutes, 1, 90, 15),
    ),
    longBreakInterval: Math.round(
      clamp(s.longBreakInterval ?? DEFAULT_SETTINGS.longBreakInterval, 2, 8, 4),
    ),
    autoStartBreak: Boolean(s.autoStartBreak),
    autoStartFocus: Boolean(s.autoStartFocus),
    soundEnabled: typeof s.soundEnabled === 'boolean' ? s.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    soundVolume: clamp(s.soundVolume ?? DEFAULT_SETTINGS.soundVolume, 0, 1, 0.65),
    ambientNoise,
    ambientVolume: clamp(s.ambientVolume ?? DEFAULT_SETTINGS.ambientVolume, 0, 1, 0.35),
    notificationsEnabled: Boolean(s.notificationsEnabled),
    theme,
  };
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isLegacySampleId(id: string): boolean {
  return (
    id.startsWith('goal-sample-') ||
    id.startsWith('task-sample-') ||
    id.startsWith('sess-sample-')
  );
}

export function loadAppState(storage?: StorageReader | null): PersistedAppState {
  const store = storage === undefined ? getBrowserStorage() : storage;
  if (!store) return createEmptyAppState();

  try {
    const raw = store.getItem(STATE_STORAGE_KEY);
    if (!raw) return createEmptyAppState();
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (
      !parsed ||
      parsed.schemaVersion !== 1 ||
      !Array.isArray(parsed.goals) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.sessions)
    ) {
      return createEmptyAppState();
    }

    const goals = parsed.goals
      .map(validateGoal)
      .filter((g): g is Goal => g !== null && !isLegacySampleId(g.id));

    const tasks = parsed.tasks
      .map(validateTask)
      .filter((t): t is Task => t !== null && !isLegacySampleId(t.id))
      .map((t) => (t.goalId && isLegacySampleId(t.goalId) ? { ...t, goalId: undefined } : t));

    const sessions = parsed.sessions
      .map(validateSession)
      .filter((s): s is FocusSession => s !== null && !isLegacySampleId(s.id));

    return {
      schemaVersion: 1,
      hasSampleData: false,
      goals,
      tasks,
      sessions,
      settings: sanitizeSettings(parsed.settings),
    };
  } catch {
    return createEmptyAppState();
  }
}

export function saveAppState(state: PersistedAppState, storage?: StorageWriter | null): void {
  const store = storage === undefined ? getBrowserStorage() : storage;
  if (!store) return;
  try {
    store.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or private browsing restricted; fail silently without crashing UI
  }
}

export function loadTimerState(
  settings: AppSettings,
  storage?: StorageReader | null,
): PersistedTimerState {
  const store = storage === undefined ? getBrowserStorage() : storage;
  if (!store) return createInitialTimerState(settings);

  try {
    const raw = store.getItem(TIMER_STORAGE_KEY);
    if (!raw) return createInitialTimerState(settings);
    const parsed = JSON.parse(raw) as Partial<PersistedTimerState>;
    const phase: TimerPhase =
      parsed.phase === 'shortBreak' || parsed.phase === 'longBreak' ? parsed.phase : 'focus';
    const status =
      parsed.status === 'running' || parsed.status === 'paused' ? parsed.status : 'idle';
    const defaultDuration = getPhaseDurationSeconds(phase, settings);
    const totalSeconds =
      typeof parsed.totalSeconds === 'number' && parsed.totalSeconds >= 60
        ? Math.round(parsed.totalSeconds)
        : defaultDuration;
    const remainingSeconds =
      typeof parsed.remainingSeconds === 'number' && parsed.remainingSeconds >= 0
        ? Math.round(parsed.remainingSeconds)
        : defaultDuration;
    const endTimestamp =
      status === 'running' && typeof parsed.endTimestamp === 'number' && Number.isFinite(parsed.endTimestamp)
        ? parsed.endTimestamp
        : null;

    return {
      phase,
      status: status === 'running' && endTimestamp === null ? 'idle' : status,
      remainingSeconds,
      endTimestamp,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      totalSeconds,
      completedFocusCycles:
        typeof parsed.completedFocusCycles === 'number' && parsed.completedFocusCycles >= 0
          ? Math.floor(parsed.completedFocusCycles)
          : 0,
      activeTaskId: typeof parsed.activeTaskId === 'string' ? parsed.activeTaskId : null,
    };
  } catch {
    return createInitialTimerState(settings);
  }
}

export function saveTimerState(state: PersistedTimerState, storage?: StorageWriter | null): void {
  const store = storage === undefined ? getBrowserStorage() : storage;
  if (!store) return;
  try {
    store.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}

export function applyDeleteTask(state: PersistedAppState, taskId: string): PersistedAppState {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  };
}

export function applyDeleteGoal(state: PersistedAppState, goalId: string): PersistedAppState {
  return {
    ...state,
    goals: state.goals.filter((goal) => goal.id !== goalId),
    tasks: state.tasks.map((task) =>
      task.goalId === goalId ? { ...task, goalId: undefined, updatedAt: Date.now() } : task,
    ),
  };
}
