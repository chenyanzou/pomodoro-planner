import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Flame, Sparkles, Trophy } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import {
  computeDailyTrend,
  computeGoalDistribution,
  computeHeatmapWeeks,
  computeKpiSummary,
} from '../../utils/analytics';
import { toLocalDateKey } from '../../utils/date';
import { ActivityHeatmap } from './ActivityHeatmap';
import { GoalDonutChart } from './GoalDonutChart';
import { SessionHistory } from './SessionHistory';
import { TrendBarChart } from './TrendBarChart';

export default function AnalyticsView() {
  const { state, isDemoMode, toggleDemoMode } = useAppData();
  const [range, setRange] = useState<7 | 30>(7);
  const todayKey = toLocalDateKey();

  const kpi = useMemo(() => computeKpiSummary(state.sessions, todayKey), [state.sessions, todayKey]);
  const trend = useMemo(
    () => computeDailyTrend(state.sessions, todayKey, range),
    [state.sessions, todayKey, range],
  );
  const distribution = useMemo(
    () => computeGoalDistribution(state.sessions, state.goals),
    [state.sessions, state.goals],
  );
  const heatmap = useMemo(() => computeHeatmapWeeks(state.sessions, todayKey, 12), [state.sessions, todayKey]);

  const cards = [
    {
      label: '今日专注',
      num: `${kpi.todayMinutes}`,
      unit: '分钟',
      sub: `${kpi.todayPomodoros} 颗番茄`,
      icon: Clock3,
      accent: 'var(--accent-focus)',
      soft: 'var(--accent-focus-soft)',
    },
    {
      label: '本周累计',
      num: `${kpi.weekMinutes}`,
      unit: '分钟',
      sub: `${kpi.weekPomodoros} 颗番茄`,
      icon: CalendarDays,
      accent: 'var(--accent-break)',
      soft: 'var(--accent-break-soft)',
    },
    {
      label: '本月累计',
      num: (kpi.monthMinutes / 60).toFixed(1),
      unit: '小时',
      sub: `${kpi.monthPomodoros} 颗 · ${kpi.monthMinutes} 分钟`,
      icon: Trophy,
      accent: 'var(--accent-gold)',
      soft: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
    },
    {
      label: '连续专注',
      num: `${kpi.streakDays}`,
      unit: '天',
      sub: kpi.streakDays > 0 ? '保持每日专注节奏' : '完成 1 颗番茄开启记录',
      icon: Flame,
      accent: 'var(--accent-focus)',
      soft: 'var(--accent-focus-soft)',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3.5 py-5 sm:px-6 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif-italic text-[13px] text-[var(--text-muted)]">Focus Review</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">复盘统计看板</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            所有图表实时聚合自本地专注流水，隐私数据完全保存在当前设备。
          </p>
        </div>

        {state.sessions.length === 0 && !isDemoMode && (
          <button type="button" onClick={toggleDemoMode} className="focus-ring btn-soft h-9 px-3.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
            预览演示数据图表
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div className="stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="paper-card group min-w-0 overflow-hidden rounded-[24px] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-[var(--text-secondary)]">{card.label}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: card.soft, color: card.accent }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="num-display text-3xl font-semibold !tracking-[-0.03em] text-[var(--text-primary)]">
                  {card.num}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">{card.unit}</span>
              </div>
              <p className="tabular-nums mt-1.5 truncate text-xs text-[var(--text-muted)]">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <TrendBarChart points={trend} range={range} onChangeRange={setRange} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <GoalDonutChart slices={distribution} />
        </div>
      </div>

      <ActivityHeatmap weeks={heatmap} />

      <SessionHistory />
    </div>
  );
}
