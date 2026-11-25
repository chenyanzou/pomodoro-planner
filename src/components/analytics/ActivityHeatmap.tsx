import { useMemo, useState } from 'react';
import type { HeatmapCell } from '../../utils/analytics';

interface ActivityHeatmapProps {
  weeks: HeatmapCell[][];
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'var(--bg-subtle)',
  1: 'color-mix(in srgb, var(--accent-focus) 24%, var(--bg-subtle))',
  2: 'color-mix(in srgb, var(--accent-focus) 48%, var(--bg-subtle))',
  3: 'color-mix(in srgb, var(--accent-focus) 74%, var(--bg-subtle))',
  4: 'var(--accent-focus)',
};

const WEEKDAY_LABELS = ['一', '', '三', '', '五', '', '日'];

export function ActivityHeatmap({ weeks }: ActivityHeatmapProps) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  const monthLabels = useMemo(() => {
    let lastMonth = '';
    return weeks.map((week) => {
      const first = week[0]?.date;
      if (!first) return '';
      const month = first.slice(5, 7);
      if (month !== lastMonth) {
        lastMonth = month;
        return `${Number(month)}月`;
      }
      return '';
    });
  }, [weeks]);

  const stats = useMemo(() => {
    const flat = weeks.flat();
    let totalMinutes = 0;
    let activeDays = 0;
    let peakDay: HeatmapCell | null = null;
    for (const cell of flat) {
      totalMinutes += cell.minutes;
      if (cell.minutes > 0) {
        activeDays += 1;
        if (!peakDay || cell.minutes > peakDay.minutes) {
          peakDay = cell;
        }
      }
    }
    return { totalMinutes, activeDays, totalDays: flat.length, peakDay };
  }, [weeks]);

  return (
    <section className="paper-card rounded-[26px] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">近 12 周专注热力图</h3>
            <span className="chip bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
              <span className="tabular-nums">{stats.activeDays}</span> / {stats.totalDays} 天活跃
            </span>
          </div>
          <p className="tabular-nums mt-0.5 text-xs text-[var(--text-muted)]">
            {hovered
              ? `${hovered.date} · 专注 ${hovered.minutes} 分钟`
              : '每个圆角格代表一天，颜色越暖深表示当日专注投入越高'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <span>少</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className="h-3.5 w-3.5 rounded-[5px]"
              style={{
                backgroundColor: LEVEL_COLORS[lvl],
                boxShadow:
                  lvl >= 3
                    ? `0 0 6px color-mix(in srgb, var(--accent-focus) ${lvl === 4 ? 42 : 24}%, transparent)`
                    : undefined,
              }}
            />
          ))}
          <span>多</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-center">
        <div className="min-w-0 overflow-x-auto pb-1 lg:col-span-7">
          <div className="inline-flex flex-col gap-1.5">
            {/* Month labels row */}
            <div className="flex items-center gap-2 pl-5 text-[10.5px] font-medium text-[var(--text-muted)]">
              {monthLabels.map((m, idx) => (
                <span key={idx} className="w-[18px] shrink-0 text-left whitespace-nowrap sm:w-[22px]">
                  {m}
                </span>
              ))}
            </div>

            <div className="inline-flex items-start gap-2">
              <div className="grid grid-rows-7 gap-2 text-[10px] text-[var(--text-muted)]">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <span key={idx} className="flex h-[18px] w-3 items-center justify-center sm:h-[22px]">
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-2">
                    {week.map((cell) => {
                      const isActive = hovered?.date === cell.date;
                      return (
                        <button
                          key={cell.date}
                          type="button"
                          onMouseEnter={() => setHovered(cell)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(cell)}
                          onBlur={() => setHovered(null)}
                          aria-label={`${cell.date} 专注 ${cell.minutes} 分钟`}
                          className={`focus-ring h-[18px] w-[18px] rounded-[5px] transition-all duration-150 sm:h-[22px] sm:w-[22px] sm:rounded-[6px] ${
                            isActive ? 'scale-120 ring-2 ring-[var(--text-primary)]/40' : 'hover:scale-120'
                          }`}
                          style={{
                            backgroundColor: LEVEL_COLORS[cell.level],
                            boxShadow:
                              cell.level >= 3
                                ? `0 0 8px -1px color-mix(in srgb, var(--accent-focus) ${cell.level === 4 ? 48 : 26}%, transparent)`
                                : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 12-week insight summary */}
        <div className="grid grid-cols-3 gap-2.5 lg:col-span-5 lg:grid-cols-1">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] px-3.5 py-2.5">
            <p className="text-[11px] text-[var(--text-muted)]">12 周总投入</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="num-display text-xl font-semibold !tracking-[-0.03em] text-[var(--text-primary)]">
                {stats.totalMinutes}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                分钟 · {(stats.totalMinutes / 60).toFixed(1)}h
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] px-3.5 py-2.5">
            <p className="text-[11px] text-[var(--text-muted)]">活跃日均专注</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="num-display text-xl font-semibold !tracking-[-0.03em] text-[var(--accent-break)]">
                {stats.activeDays > 0 ? Math.round(stats.totalMinutes / stats.activeDays) : 0}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">分钟 / 天</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] px-3.5 py-2.5">
            <p className="text-[11px] text-[var(--text-muted)]">单日最高峰值</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="num-display text-xl font-semibold !tracking-[-0.03em] text-[var(--accent-focus)]">
                {stats.peakDay ? stats.peakDay.minutes : 0}
              </span>
              <span className="truncate text-[11px] text-[var(--text-muted)]">
                {stats.peakDay ? `分钟 · ${stats.peakDay.date.slice(5)}` : '暂无记录'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
