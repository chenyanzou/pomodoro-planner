import { useState } from 'react';
import type { GoalDistributionSlice } from '../../utils/analytics';
import { EmptyState } from '../ui/EmptyState';

interface GoalDonutChartProps {
  slices: GoalDistributionSlice[];
}

export function GoalDonutChart({ slices }: GoalDonutChartProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const totalMinutes = slices.reduce((sum, s) => sum + s.minutes, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const activeSlice = activeKey ? slices.find((s) => s.key === activeKey) ?? null : null;

  let cumulativeOffset = 0;

  return (
    <section className="paper-card flex h-full flex-col rounded-[26px] p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold tracking-tight">目标时间占比</h3>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          按历史专注流水汇总各目标投入，悬停查看占比
        </p>
      </div>

      {slices.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center">
          <div className="w-full">
            <EmptyState
              compact
              variant="analytics"
              title="暂无目标投入分布"
              description="完成一颗番茄或补录专注记录后，这里会呈现你的时间分配。"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 164 164" className="h-full w-full -rotate-90" role="img" aria-label="目标分类时间占比环图">
              <circle cx="82" cy="82" r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth="18" />
              {slices.map((slice) => {
                const segmentLen = (slice.minutes / Math.max(1, totalMinutes)) * circumference;
                const gap = slices.length > 1 ? 2.5 : 0;
                const dashArray = `${Math.max(1.5, segmentLen - gap)} ${circumference}`;
                const dashOffset = -cumulativeOffset;
                cumulativeOffset += segmentLen;
                const isActive = activeKey === slice.key;
                const isDimmed = activeKey !== null && !isActive;

                return (
                  <circle
                    key={slice.key}
                    cx="82"
                    cy="82"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isActive ? 22 : 18}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    opacity={isDimmed ? 0.35 : 1}
                    onMouseEnter={() => setActiveKey(slice.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    className="cursor-pointer transition-all duration-200"
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {activeSlice ? (
                <>
                  <span
                    className="num-display text-2xl font-semibold !tracking-[-0.03em]"
                    style={{ color: activeSlice.color }}
                  >
                    {activeSlice.percentage}%
                  </span>
                  <span className="mt-0.5 max-w-full truncate text-[11px] font-medium text-[var(--text-primary)]">
                    {activeSlice.title}
                  </span>
                  <span className="tabular-nums text-[10px] text-[var(--text-muted)]">
                    {activeSlice.minutes} 分钟
                  </span>
                </>
              ) : (
                <>
                  <span className="num-display text-2xl font-semibold !tracking-[-0.03em] text-[var(--text-primary)]">
                    {totalMinutes}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    总分钟 · {(totalMinutes / 60).toFixed(1)}h
                  </span>
                </>
              )}
            </div>
          </div>

          <ul className="w-full min-w-0 space-y-2 text-xs">
            {slices.map((slice) => {
              const isActive = activeKey === slice.key;
              return (
                <li
                  key={slice.key}
                  onMouseEnter={() => setActiveKey(slice.key)}
                  onMouseLeave={() => setActiveKey(null)}
                  className={`cursor-pointer rounded-xl px-2.5 py-1.5 transition ${
                    isActive ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate font-medium text-[var(--text-primary)]" title={slice.title}>
                        {slice.title}
                      </span>
                    </div>
                    <span className="tabular-nums shrink-0 text-[11px] text-[var(--text-secondary)]">
                      {slice.minutes}分 · <strong className="text-[var(--text-primary)]">{slice.percentage}%</strong>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
