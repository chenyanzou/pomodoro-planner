import { describe, expect, it } from 'vitest';
import type { FocusSession, Goal } from '../src/types';
import {
  computeDailyTrend,
  computeGoalDistribution,
  computeHeatmapWeeks,
  computeKpiSummary,
} from '../src/utils/analytics';

function makeSession(
  id: string,
  date: string,
  durationMinutes: number,
  goal?: { id: string; title: string; color: string },
): FocusSession {
  return {
    id,
    taskTitleSnapshot: `Task ${id}`,
    goalId: goal?.id,
    goalTitleSnapshot: goal?.title,
    goalColorSnapshot: goal?.color,
    phase: 'focus',
    durationMinutes,
    date,
    startedAt: 1_700_000_000_000,
    endedAt: 1_700_000_000_000 + durationMinutes * 60_000,
  };
}

describe('analytics aggregators', () => {
  it('calculates cross-year streak accurately and updates when sessions change', () => {
    const sessions = [
      makeSession('1', '2026-12-30', 25),
      makeSession('2', '2026-12-31', 50),
      makeSession('3', '2027-01-01', 25),
    ];

    const summary = computeKpiSummary(sessions, '2027-01-01');
    expect(summary.todayPomodoros).toBe(1);
    expect(summary.todayMinutes).toBe(25);
    expect(summary.streakDays).toBe(3);

    // Deleting Dec 31 breaks the streak down to 1 day (Jan 1 only)
    const afterDelete = computeKpiSummary([sessions[0], sessions[2]], '2027-01-01');
    expect(afterDelete.streakDays).toBe(1);
  });

  it('produces exact 7-day and 30-day chronological trend buckets ending on todayKey', () => {
    const sessions = [
      makeSession('1', '2026-11-24', 25),
      makeSession('2', '2026-11-24', 30),
      makeSession('3', '2026-11-20', 40),
    ];

    const trend7 = computeDailyTrend(sessions, '2026-11-24', 7);
    expect(trend7).toHaveLength(7);
    expect(trend7[0].date).toBe('2026-11-18');
    expect(trend7[6].date).toBe('2026-11-24');
    expect(trend7[6].minutes).toBe(55);
    expect(trend7[6].count).toBe(2);

    const trend30 = computeDailyTrend(sessions, '2026-11-24', 30);
    expect(trend30).toHaveLength(30);
    expect(trend30[29].date).toBe('2026-11-24');
  });

  it('aggregates goal distribution preserving deleted goal snapshots and grouping unlinked sessions', () => {
    const goals: Goal[] = [
      {
        id: 'g1',
        title: '算法冲刺',
        color: '#D95338',
        targetPomodoros: 10,
        archived: false,
        createdAt: 1,
      },
    ];
    const sessions = [
      makeSession('1', '2026-11-24', 50, { id: 'g1', title: '旧标题', color: '#D95338' }),
      makeSession('2', '2026-11-24', 25, { id: 'g-deleted', title: '已删目标', color: '#4A7C9B' }),
      makeSession('3', '2026-11-24', 25),
    ];

    const dist = computeGoalDistribution(sessions, goals);
    expect(dist).toHaveLength(3);
    expect(dist[0]).toMatchObject({ key: 'g1', title: '算法冲刺', minutes: 50, percentage: 50 });
    expect(dist.find((d) => d.key === 'g-deleted')).toMatchObject({
      title: '已删目标',
      minutes: 25,
      percentage: 25,
    });
    expect(dist.find((d) => d.key === '__unlinked__')).toMatchObject({
      title: '日常零散专注',
      minutes: 25,
      percentage: 25,
    });
  });

  it('builds a 12-week heatmap grid with 0..4 intensity levels', () => {
    const sessions = [
      makeSession('1', '2026-11-24', 120),
      makeSession('2', '2026-11-23', 25),
    ];
    const weeks = computeHeatmapWeeks(sessions, '2026-11-24', 12);
    expect(weeks).toHaveLength(12);
    const allCells = weeks.flat();
    const todayCell = allCells.find((c) => c.date === '2026-11-24');
    const yesterdayCell = allCells.find((c) => c.date === '2026-11-23');
    expect(todayCell?.level).toBe(4);
    expect(yesterdayCell?.level).toBe(1);
  });
});
