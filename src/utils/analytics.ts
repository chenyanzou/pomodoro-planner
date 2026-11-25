import type { FocusSession, Goal } from '../types';
import { addDays, formatShortDate, parseDateKey } from './date';

export interface KpiSummary {
  todayPomodoros: number;
  todayMinutes: number;
  weekPomodoros: number;
  weekMinutes: number;
  monthPomodoros: number;
  monthMinutes: number;
  streakDays: number;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  minutes: number;
  count: number;
}

export interface GoalDistributionSlice {
  key: string;
  title: string;
  color: string;
  minutes: number;
  percentage: number;
}

export interface HeatmapCell {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function getStartOfWeekKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay(); // 0=Sun..6=Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  return addDays(dateKey, offsetToMonday);
}

export function computeKpiSummary(sessions: FocusSession[], todayKey: string): KpiSummary {
  const weekStart = getStartOfWeekKey(todayKey);
  const monthPrefix = todayKey.slice(0, 7);

  let todayPomodoros = 0;
  let todayMinutes = 0;
  let weekPomodoros = 0;
  let weekMinutes = 0;
  let monthPomodoros = 0;
  let monthMinutes = 0;

  const activeDays = new Set<string>();

  for (const s of sessions) {
    if (s.durationMinutes > 0) {
      activeDays.add(s.date);
    }
    if (s.date === todayKey) {
      todayPomodoros += 1;
      todayMinutes += s.durationMinutes;
    }
    if (s.date >= weekStart && s.date <= todayKey) {
      weekPomodoros += 1;
      weekMinutes += s.durationMinutes;
    }
    if (s.date.startsWith(monthPrefix) && s.date <= todayKey) {
      monthPomodoros += 1;
      monthMinutes += s.durationMinutes;
    }
  }

  let streakDays = 0;
  let cursor = activeDays.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (activeDays.has(cursor)) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    todayPomodoros,
    todayMinutes,
    weekPomodoros,
    weekMinutes,
    monthPomodoros,
    monthMinutes,
    streakDays,
  };
}

export function computeDailyTrend(
  sessions: FocusSession[],
  todayKey: string,
  days: 7 | 30,
): DailyTrendPoint[] {
  const bucketMap = new Map<string, { minutes: number; count: number }>();
  for (const s of sessions) {
    const existing = bucketMap.get(s.date) ?? { minutes: 0, count: 0 };
    existing.minutes += s.durationMinutes;
    existing.count += 1;
    bucketMap.set(s.date, existing);
  }

  const points: DailyTrendPoint[] = [];
  for (let offset = -(days - 1); offset <= 0; offset++) {
    const date = addDays(todayKey, offset);
    const data = bucketMap.get(date);
    points.push({
      date,
      label: formatShortDate(date),
      minutes: data?.minutes ?? 0,
      count: data?.count ?? 0,
    });
  }
  return points;
}

export function computeGoalDistribution(
  sessions: FocusSession[],
  goals: Goal[],
): GoalDistributionSlice[] {
  const goalMap = new Map(goals.map((g) => [g.id, g]));
  const totals = new Map<string, { title: string; color: string; minutes: number }>();
  let grandTotal = 0;

  for (const s of sessions) {
    if (s.durationMinutes <= 0) continue;
    grandTotal += s.durationMinutes;

    const key = s.goalId ?? '__unlinked__';
    const liveGoal = s.goalId ? goalMap.get(s.goalId) : undefined;
    const title = liveGoal?.title ?? s.goalTitleSnapshot ?? '日常零散专注';
    const color = liveGoal?.color ?? s.goalColorSnapshot ?? '#9C9488';

    const existing = totals.get(key) ?? { title, color, minutes: 0 };
    existing.minutes += s.durationMinutes;
    totals.set(key, existing);
  }

  if (grandTotal === 0) return [];

  return Array.from(totals.entries())
    .map(([key, item]) => ({
      key,
      title: item.title,
      color: item.color,
      minutes: item.minutes,
      percentage: Math.round((item.minutes / grandTotal) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

function minutesToHeatmapLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes <= 25) return 1;
  if (minutes <= 50) return 2;
  if (minutes <= 99) return 3;
  return 4;
}

export function computeHeatmapWeeks(
  sessions: FocusSession[],
  todayKey: string,
  weeks = 12,
): HeatmapCell[][] {
  const minuteMap = new Map<string, number>();
  for (const s of sessions) {
    minuteMap.set(s.date, (minuteMap.get(s.date) ?? 0) + s.durationMinutes);
  }

  // Align grid to Monday..Sunday columns ending on the week containing todayKey
  const currentWeekStart = getStartOfWeekKey(todayKey);
  const gridStart = addDays(currentWeekStart, -(weeks - 1) * 7);

  const columns: HeatmapCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const minutes = date <= todayKey ? (minuteMap.get(date) ?? 0) : 0;
      col.push({
        date,
        minutes,
        level: minutesToHeatmapLevel(minutes),
      });
    }
    columns.push(col);
  }
  return columns;
}
