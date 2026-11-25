import type { GoalDistributionSlice } from '../../utils/analytics';

interface GoalDonutChartProps {
  slices: GoalDistributionSlice[];
}

export function GoalDonutChart({ slices }: GoalDonutChartProps) {
  const totalMinutes = slices.reduce((sum, s) => sum + s.minutes, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <section className="paper-card rounded-3xl p-5 sm:p-6">
      <h3 className="text-base font-semibold">目标时间占比</h3>
      <p className="text-xs text-[var(--text-muted)]">按历史专注记录汇总各目标投入</p>

      {slices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-strong)] py-12 text-center text-xs text-[var(--text-muted)]">
          暂无专注数据，完成一个番茄钟后即可生成分布图
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="目标分类时间占比环图">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--bg-subtle)"
                strokeWidth="18"
              />
              {slices.map((slice) => {
                const segmentLen = (slice.minutes / Math.max(1, totalMinutes)) * circumference;
                const dashArray = `${Math.max(1, segmentLen - 1.5)} ${circumference}`;
                const dashOffset = -cumulativeOffset;
                cumulativeOffset += segmentLen;
                return (
                  <circle
                    key={slice.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="18"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="tabular-nums text-xl font-semibold">{totalMinutes}</span>
              <span className="text-[11px] text-[var(--text-muted)]">总分钟</span>
            </div>
          </div>

          <ul className="w-full space-y-2.5 text-xs">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate font-medium text-[var(--text-primary)]">
                    {slice.title}
                  </span>
                </div>
                <span className="tabular-nums shrink-0 text-[var(--text-secondary)]">
                  {slice.minutes} 分 · {slice.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
