import { describe, expect, it } from 'vitest';
import type { AppSettings } from '../src/types';
import {
  createInitialTimerState,
  getRemainingSeconds,
  pauseTimer,
  reconcileTimerAt,
  resetTimer,
  startTimer,
  switchTimerPhase,
} from '../src/utils/timerEngine';

const settings: AppSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.65,
  ambientNoise: 'off',
  ambientVolume: 0.35,
  notificationsEnabled: false,
  theme: 'light',
};

describe('timerEngine', () => {
  it('computes drift-free remaining seconds from endTimestamp and preserves on pause', () => {
    const startMs = 1_700_000_000_000;
    const initial = createInitialTimerState(settings);
    const running = startTimer(initial, startMs);

    expect(running.status).toBe('running');
    expect(running.endTimestamp).toBe(startMs + 25 * 60 * 1000);
    expect(getRemainingSeconds(running, startMs + 60_000)).toBe(24 * 60);

    const paused = pauseTimer(running, startMs + 95_000);
    expect(paused.status).toBe('paused');
    expect(paused.endTimestamp).toBeNull();
    expect(paused.remainingSeconds).toBe(25 * 60 - 95);
  });

  it('completes focus session offline, advances cycle, triggers longBreak on interval, and avoids double-logging', () => {
    const startMs = 1_700_000_000_000;
    const initial = {
      ...createInitialTimerState(settings),
      activeTaskId: 'task-1',
      completedFocusCycles: 3,
    };
    const running = startTimer(initial, startMs);

    // Return 10 minutes after scheduled completion
    const returnMs = startMs + 35 * 60 * 1000;
    const result = reconcileTimerAt(running, settings, returnMs);

    expect(result.phaseEnded).toBe('focus');
    expect(result.completedFocus).toEqual({
      startedAt: startMs,
      endedAt: startMs + 25 * 60 * 1000,
      durationMinutes: 25,
      taskId: 'task-1',
    });
    expect(result.nextState.phase).toBe('longBreak');
    expect(result.nextState.completedFocusCycles).toBe(4);
    expect(result.nextState.status).toBe('idle');
    expect(result.nextState.remainingSeconds).toBe(15 * 60);

    // Calling reconcile again on nextState must never double-log
    const secondPass = reconcileTimerAt(result.nextState, settings, returnMs + 1000);
    expect(secondPass.completedFocus).toBeNull();
    expect(secondPass.phaseEnded).toBeNull();
  });

  it('transitions cycles 1..3 from focus to shortBreak and auto-starts break when enabled', () => {
    const startMs = 1_700_000_000_000;
    const autoSettings: AppSettings = { ...settings, autoStartBreak: true };
    const running = startTimer(createInitialTimerState(autoSettings), startMs);

    const result = reconcileTimerAt(running, autoSettings, startMs + 25 * 60 * 1000 + 200);
    expect(result.nextState.phase).toBe('shortBreak');
    expect(result.nextState.completedFocusCycles).toBe(1);
    expect(result.nextState.status).toBe('running');
    expect(result.nextState.endTimestamp).toBe(startMs + 25 * 60 * 1000 + 200 + 5 * 60 * 1000);
  });

  it('switches phases and resets cleanly while keeping activeTaskId', () => {
    const base = { ...createInitialTimerState(settings), activeTaskId: 'task-42' };
    const onBreak = switchTimerPhase(base, 'shortBreak', settings);
    expect(onBreak.phase).toBe('shortBreak');
    expect(onBreak.remainingSeconds).toBe(5 * 60);
    expect(onBreak.activeTaskId).toBe('task-42');

    const reset = resetTimer({ ...onBreak, remainingSeconds: 120, status: 'paused' }, settings);
    expect(reset.status).toBe('idle');
    expect(reset.remainingSeconds).toBe(5 * 60);
    expect(reset.activeTaskId).toBe('task-42');
  });
});
