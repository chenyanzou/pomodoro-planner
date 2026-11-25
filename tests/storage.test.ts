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

  it('filters out partially corrupted items inside persisted arrays instead of crashing render', () => {
    const partialStorage = makeMemoryStorage({
      [STATE_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        hasSampleData: false,
        goals: [null, { id: 'g1', title: '有效目标', color: '#D95338', targetPomodoros: 5, archived: false, createdAt: 1 }, { broken: true }],
        tasks: [null, { id: 't1', title: '坏任务', date: 'invalid-date' }, {
          id: 't2',
          title: '有效任务',
          date: '2026-11-24',
          timeSlot: 'morning',
          priority: 'high',
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          completed: false,
          order: 0,
          createdAt: 1,
          updatedAt: 1,
        }],
        sessions: [null, { id: 's1', durationMinutes: -5 }, {
          id: 's2',
          taskTitleSnapshot: '有效记录',
          phase: 'focus',
          durationMinutes: 25,
          date: '2026-11-24',
          startedAt: 1,
          endedAt: 2,
        }],
        settings: {},
      }),
    });

    const loaded = loadAppState(partialStorage);
    expect(loaded.goals).toHaveLength(1);
    expect(loaded.goals[0].id).toBe('g1');
    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.tasks[0].id).toBe('t2');
    expect(loaded.sessions).toHaveLength(1);
    expect(loaded.sessions[0].id).toBe('s2');
  });
});
