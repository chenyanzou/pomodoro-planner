import type { FocusSession, Goal, Priority, Task, TimeSlot } from '../types';
import { isValidDateKey } from './date';

const VALID_PRIORITIES = new Set<Priority>(['high', 'medium', 'low']);
const VALID_SLOTS = new Set<TimeSlot>(['morning', 'afternoon', 'evening', 'anytime']);

export function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function validateGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (typeof raw.color !== 'string' || !raw.color.trim()) return null;
  if (
    typeof raw.targetPomodoros !== 'number' ||
    !Number.isFinite(raw.targetPomodoros) ||
    raw.targetPomodoros < 1
  ) {
    return null;
  }
  if (raw.deadline !== undefined && (typeof raw.deadline !== 'string' || !isValidDateKey(raw.deadline))) {
    return null;
  }
  return {
    id: raw.id,
    title: raw.title.trim(),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    color: raw.color,
    targetPomodoros: Math.round(raw.targetPomodoros),
    deadline: typeof raw.deadline === 'string' ? raw.deadline : undefined,
    archived: Boolean(raw.archived),
    createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
  };
}

export function validateTask(raw: unknown): Task | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (typeof raw.date !== 'string' || !isValidDateKey(raw.date)) return null;
  if (typeof raw.timeSlot !== 'string' || !VALID_SLOTS.has(raw.timeSlot as TimeSlot)) return null;
  if (typeof raw.priority !== 'string' || !VALID_PRIORITIES.has(raw.priority as Priority)) return null;
  if (
    typeof raw.estimatedPomodoros !== 'number' ||
    !Number.isFinite(raw.estimatedPomodoros) ||
    raw.estimatedPomodoros < 1
  ) {
    return null;
  }
  if (
    typeof raw.completedPomodoros !== 'number' ||
    !Number.isFinite(raw.completedPomodoros) ||
    raw.completedPomodoros < 0
  ) {
    return null;
  }

  return {
    id: raw.id,
    title: raw.title.trim(),
    note: typeof raw.note === 'string' ? raw.note : undefined,
    date: raw.date,
    timeSlot: raw.timeSlot as TimeSlot,
    priority: raw.priority as Priority,
    goalId: typeof raw.goalId === 'string' ? raw.goalId : undefined,
    estimatedPomodoros: Math.min(16, Math.round(raw.estimatedPomodoros)),
    completedPomodoros: Math.round(raw.completedPomodoros),
    completed: Boolean(raw.completed),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
    createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
  };
}

export function validateSession(raw: unknown): FocusSession | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.taskTitleSnapshot !== 'string' || !raw.taskTitleSnapshot.trim()) return null;
  if (typeof raw.date !== 'string' || !isValidDateKey(raw.date)) return null;
  if (
    typeof raw.durationMinutes !== 'number' ||
    !Number.isFinite(raw.durationMinutes) ||
    raw.durationMinutes < 1 ||
    raw.durationMinutes > 480
  ) {
    return null;
  }

  return {
    id: raw.id,
    taskId: typeof raw.taskId === 'string' ? raw.taskId : undefined,
    taskTitleSnapshot: raw.taskTitleSnapshot.trim(),
    goalId: typeof raw.goalId === 'string' ? raw.goalId : undefined,
    goalTitleSnapshot: typeof raw.goalTitleSnapshot === 'string' ? raw.goalTitleSnapshot : undefined,
    goalColorSnapshot: typeof raw.goalColorSnapshot === 'string' ? raw.goalColorSnapshot : undefined,
    phase: 'focus',
    durationMinutes: Math.round(raw.durationMinutes),
    date: raw.date,
    startedAt: typeof raw.startedAt === 'number' && Number.isFinite(raw.startedAt) ? raw.startedAt : Date.now(),
    endedAt: typeof raw.endedAt === 'number' && Number.isFinite(raw.endedAt) ? raw.endedAt : Date.now(),
    note: typeof raw.note === 'string' ? raw.note : undefined,
  };
}
