import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Flame, Trophy } from 'lucide-react';
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
  const { state } = useAppData();
  const [range, setRange] = useState<7 | 30>(7);
  const todayKey = toLocalDateKey();

  const kpi = useMemo(
    () => computeKpiSummary(state.sessions, todayKey),
    [state.sessions, todayKey],
  );
  const trend = useMemo(
    () => computeDailyTrend(state.sessions, todayKey, range),
    [state.sessions, todayKey, range],
  );
  const distribution = useMemo(
    () => computeGoalDistribution(state.sessions, state.goals),
    [state.sessions, state.goals],
  );
  const heatmap = useMemo(
    () => computeHeatmapWeeks(state.sessions, todayKey, 12),
    [state.sessions, todayKey],
  );

  const cards = [
    {
      label: '今日专注',
      value: `${kpi.todayMinutes} 分钟`,
      sub: `${kpi.todayPomodoros} 个番茄`,
      icon: Clock3,
      accent: 'var(--accent-focus)',
    },
    {
      label: '本周累计',
      value: `${kpi.weekMinutes} 分钟`,
      sub: `${kpi.weekPomodoros} 个番茄`,
      icon: CalendarDays,
      accent: 'var(--accent-break)',
    },
    {
      label: '本月累计',
      value: `${(kpi.monthMinutes / 60).toFixed(1)} 小时`,
      sub: `${kpi.monthPomodoros} 个番茄 · ${kpi.monthMinutes} 分钟`,
      icon: Trophy,
      accent: '#C88A2E',
    },
    {
      label: '连续专注',
      value: `${kpi.streakDays} 天`,
      sub: kpi.streakDays > 0 ? '继续保持每日节奏' : '今天完成 1 个番茄开启记录',
      icon: Flame,
      accent: '#D95338',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">复盘统计看板</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          所有统计实时聚合自你的本地专注记录，无需联网、隐私完全保存在当前设备。
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="paper-card rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {card.label}
                </span>
                <Icon className="h-4 w-4" style={{ color: card.accent }} />
              </div>
              <div className="tabular-nums mt-2 text-2xl font-semibold tracking-tight">
                {card.value}
              </div>
              <p className="tabular-nums mt-1 text-xs text-[var(--text-muted)]">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TrendBarChart points={trend} range={range} onChangeRange={setRange} />
        </div>
        <div className="lg:col-span-5">
          <GoalDonutChart slices={distribution} />
        </div>
      </div>

      <ActivityHeatmap weeks={heatmap} />

      <SessionHistory />
    </div>
  );
}
