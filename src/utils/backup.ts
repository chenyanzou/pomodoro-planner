import type { FocusSession, Goal, PersistedAppState, Task } from '../types';
import { sanitizeSettings } from './storage';
import { isRecord, validateGoal, validateSession, validateTask } from './validators';

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

export function createBackupPayload(state: PersistedAppState): string {
  const envelope: BackupEnvelope = {
    app: 'pomodoro-planner',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(envelope, null, 2);
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

  const rootVersion = parsed.schemaVersion;
  if (rootVersion !== 1) {
    return { ok: false, error: `不支持的备份格式版本（${String(rootVersion)}），当前仅支持 v1。` };
  }

  const candidate = isRecord(parsed.data) ? parsed.data : parsed;
  if (candidate.schemaVersion !== undefined && candidate.schemaVersion !== 1) {
    return { ok: false, error: `不支持的内部数据版本（${String(candidate.schemaVersion)}）。` };
  }
  if (!Array.isArray(candidate.goals) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.sessions)) {
    return { ok: false, error: '备份文件缺少 goals / tasks / sessions 必要字段。' };
  }

  const goals: Goal[] = [];
  for (const item of candidate.goals) {
    const valid = validateGoal(item);
    if (!valid) return { ok: false, error: '备份中的目标数据存在无效字段或日期格式错误。' };
    goals.push(valid);
  }

  const goalIds = new Set(goals.map((g) => g.id));
  const tasks: Task[] = [];
  for (const item of candidate.tasks) {
    const valid = validateTask(item);
    if (!valid) return { ok: false, error: '备份中的任务数据存在无效字段、番茄数或日期格式错误。' };
    tasks.push({
      ...valid,
      goalId: valid.goalId && goalIds.has(valid.goalId) ? valid.goalId : undefined,
    });
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
