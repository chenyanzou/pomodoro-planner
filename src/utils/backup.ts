import type { FocusSession, Goal, PersistedAppState, Priority, Task, TimeSlot } from '../types';
import { isValidDateKey } from './date';
import { sanitizeSettings } from './storage';

export interface BackupEnvelope {
  app: 'pomodoro-planner';
  schemaVersion: 1;
  exportedAt: string;
  data: PersistedAppState;
}

export type BackupParseResult =
  | {
      ok: true;
      state: PersistedAppState;
      summary: { goals: number; tasks: number; sessions: number };
    }
  | { ok: false; error: string };

const VALID_PRIORITIES = new Set<Priority>(['high', 'medium', 'low']);
const VALID_SLOTS = new Set<TimeSlot>(['morning', 'afternoon', 'evening', 'anytime']);

export function createBackupPayload(state: PersistedAppState): string {
  const envelope: BackupEnvelope = {
    app: 'pomodoro-planner',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(envelope, null, 2);
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function validateGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (typeof raw.color !== 'string' || !raw.color.trim()) return null;
  if (typeof raw.targetPomodoros !== 'number' || !Number.isFinite(raw.targetPomodoros) || raw.targetPomodoros < 1) {
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

function validateTask(raw: unknown): Task | null {
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

function validateSession(raw: unknown): FocusSession | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.taskTitleSnapshot !== 'string' || !raw.taskTitleSnapshot.trim()) return null;
  if (typeof raw.date !== 'string' || !isValidDateKey(raw.date)) return null;
  if (
    typeof raw.durationMinutes !== 'number' ||
    !Number.isFinite(raw.durationMinutes) ||
    raw.durationMinutes <= 0 ||
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

export function parseAndValidateBackup(rawJson: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: '备份文件不是有效的 JSON 格式，请检查后重试。' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: '备份文件内容结构不正确。' };
  }

  // Support both enveloped format { schemaVersion: 1, data: ... } and raw PersistedAppState
  const rootVersion = parsed.schemaVersion;
  if (rootVersion !== 1) {
    return { ok: false, error: `不支持的备份格式版本（${String(rootVersion)}），当前仅支持 v1。` };
  }

  const candidate = isRecord(parsed.data) ? parsed.data : parsed;
  if (!Array.isArray(candidate.goals) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.sessions)) {
    return { ok: false, error: '备份文件缺少 goals / tasks / sessions 必要字段。' };
  }

  const goals: Goal[] = [];
  for (const item of candidate.goals) {
    const valid = validateGoal(item);
    if (!valid) return { ok: false, error: '备份中的目标数据存在无效字段或日期格式错误。' };
    goals.push(valid);
  }

  const tasks: Task[] = [];
  for (const item of candidate.tasks) {
    const valid = validateTask(item);
    if (!valid) return { ok: false, error: '备份中的任务数据存在无效字段、番茄数或日期格式错误。' };
    tasks.push(valid);
  }

  const sessions: FocusSession[] = [];
  for (const item of candidate.sessions) {
    const valid = validateSession(item);
    if (!valid) return { ok: false, error: '备份中的专注记录存在无效时长或日期格式错误。' };
    sessions.push(valid);
  }

  const state: PersistedAppState = {
    schemaVersion: 1,
    hasSampleData: false,
    goals,
    tasks,
    sessions,
    settings: sanitizeSettings(candidate.settings),
  };

  return {
    ok: true,
    state,
    summary: {
      goals: goals.length,
      tasks: tasks.length,
      sessions: sessions.length,
    },
  };
}
