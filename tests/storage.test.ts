import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  STATE_STORAGE_KEY,
  TIMER_STORAGE_KEY,
  applyDeleteGoal,
  applyDeleteTask,
  loadAppState,
  loadTimerState,
} from '../src/utils/storage';

function makeMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('storage and deletion contracts', () => {
  it('recovers gracefully from corrupted JSON in localStorage without throwing', () => {
    const brokenStorage = makeMemoryStorage({
      [STATE_STORAGE_KEY]: '{not valid json',
      [TIMER_STORAGE_KEY]: '%%%broken',
    });

    const appState = loadAppState(brokenStorage);
    expect(appState.schemaVersion).toBe(1);
    expect(appState.hasSampleData).toBe(true);
    expect(appState.goals.length).toBeGreaterThan(0);
    expect(appState.tasks.length).toBeGreaterThan(0);

    const timerState = loadTimerState(DEFAULT_SETTINGS, brokenStorage);
    expect(timerState.phase).toBe('focus');
    expect(timerState.status).toBe('idle');
    expect(timerState.remainingSeconds).toBe(DEFAULT_SETTINGS.focusMinutes * 60);
  });

  it('preserves FocusSession snapshots and linked tasks when a goal is deleted', () => {
    const state = loadAppState(makeMemoryStorage());
    const goalId = state.goals[0].id;
    const beforeTaskCount = state.tasks.length;
    const beforeSessionCount = state.sessions.length;
    const affectedSession = state.sessions.find((s) => s.goalId === goalId);
    expect(affectedSession).toBeDefined();

    const next = applyDeleteGoal(state, goalId);
    expect(next.goals.some((g) => g.id === goalId)).toBe(false);
    expect(next.tasks.length).toBe(beforeTaskCount);
    expect(next.tasks.some((t) => t.goalId === goalId)).toBe(false);
    expect(next.sessions.length).toBe(beforeSessionCount);
    const preservedSession = next.sessions.find((s) => s.id === affectedSession!.id);
    expect(preservedSession?.goalTitleSnapshot).toBe(affectedSession!.goalTitleSnapshot);
  });

  it('removes a task while preserving historical FocusSession snapshots', () => {
    const state = loadAppState(makeMemoryStorage());
    const targetTask = state.tasks[0];
    const next = applyDeleteTask(state, targetTask.id);
    expect(next.tasks.some((t) => t.id === targetTask.id)).toBe(false);
    expect(next.sessions.length).toBe(state.sessions.length);
  });
});
