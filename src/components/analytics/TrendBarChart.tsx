import { useState } from 'react';
import type { DailyTrendPoint } from '../../utils/analytics';

interface TrendBarChartProps {
  points: DailyTrendPoint[];
  range: 7 | 30;
  onChangeRange: (days: 7 | 30) => void;
}

export function TrendBarChart({ points, range, onChangeRange }: TrendBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxMinutes = Math.max(25, ...points.map((p) => p.minutes));
  const chartHeight = 160;
  const chartWidth = 560;
  const paddingX = 18;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const slotWidth = (chartWidth - paddingX * 2) / Math.max(1, points.length);
  const barWidth = Math.max(6, Math.min(28, slotWidth * 0.62));

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <section className="paper-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">专注时长趋势</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {hovered
              ? `${hovered.date} · 专注 ${hovered.minutes} 分钟（${hovered.count} 个番茄）`
              : `悬停柱条查看每日明细（单位：分钟）`}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-[var(--bg-subtle)] p-0.5 text-xs">
          {([7, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onChangeRange(days)}
              className={`focus-ring rounded-lg px-2.5 py-1 font-medium transition ${
                range === days
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              近 {days} 天
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-44 w-full min-w-[320px]"
          role="img"
          aria-label={`近 ${range} 天专注时长柱状图`}
        >
          {/* Baseline & Midline */}
          <line
            x1={paddingX}
            y1={paddingTop + plotHeight / 2}
            x2={chartWidth - paddingX}
            y2={paddingTop + plotHeight / 2}
            stroke="var(--border-subtle)"
            strokeDasharray="3 4"
          />
          <line
            x1={paddingX}
            y1={paddingTop + plotHeight}
            x2={chartWidth - paddingX}
            y2={paddingTop + plotHeight}
            stroke="var(--border-strong)"
          />

          {points.map((point, idx) => {
            const xCenter = paddingX + idx * slotWidth + slotWidth / 2;
            const barH = point.minutes > 0 ? Math.max(4, (point.minutes / maxMinutes) * plotHeight) : 2;
            const y = paddingTop + plotHeight - barH;
            const isHovered = hoveredIdx === idx;
            const showLabel = range === 7 || idx % 5 === 0 || idx === points.length - 1;

            return (
              <g
                key={point.date}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={xCenter - slotWidth / 2}
                  y={paddingTop}
                  width={slotWidth}
                  height={plotHeight}
                  fill="transparent"
                />
                <rect
                  x={xCenter - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={Math.min(5, barWidth / 2)}
                  fill={
                    point.minutes === 0
                      ? 'var(--bg-subtle)'
                      : isHovered
                        ? 'var(--accent-focus-hover)'
                        : 'var(--accent-focus)'
                  }
                  opacity={hoveredIdx !== null && !isHovered ? 0.55 : 1}
                  className="transition-all duration-150"
                />
                {showLabel && (
                  <text
                    x={xCenter}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-muted)"
                    className="tabular-nums"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
