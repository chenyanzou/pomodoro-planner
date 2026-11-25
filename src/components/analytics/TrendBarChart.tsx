import { useId, useState } from 'react';
import type { DailyTrendPoint } from '../../utils/analytics';
import { SegmentedControl } from '../ui/SegmentedControl';

interface TrendBarChartProps {
  points: DailyTrendPoint[];
  range: 7 | 30;
  onChangeRange: (days: 7 | 30) => void;
}

export function TrendBarChart({ points, range, onChangeRange }: TrendBarChartProps) {
  const uid = useId().replace(/:/g, '');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(0, ...points.map((p) => p.minutes));
  const maxMinutes = Math.max(30, Math.ceil(rawMax / 25) * 25);
  const totalMinutes = points.reduce((s, p) => s + p.minutes, 0);

  const chartHeight = 196;
  const chartWidth = 560;
  const paddingLeft = 36;
  const paddingRight = 14;
  const paddingTop = 34;
  const paddingBottom = 26;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const slotWidth = plotWidth / Math.max(1, points.length);
  const barWidth = Math.max(6, Math.min(28, slotWidth * 0.58));

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;
  const hoveredX =
    hoveredIdx !== null ? paddingLeft + hoveredIdx * slotWidth + slotWidth / 2 : 0;
  const tooltipW = 136;
  const tooltipX = Math.max(
    paddingLeft,
    Math.min(chartWidth - paddingRight - tooltipW, hoveredX - tooltipW / 2),
  );

  return (
    <section className="paper-card flex h-full flex-col rounded-[26px] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">专注时长趋势</h3>
          <p className="tabular-nums mt-0.5 text-xs text-[var(--text-muted)]">
            {hovered
              ? `${hovered.date} · ${hovered.minutes} 分钟（${hovered.count} 颗番茄）`
              : `近 ${range} 天累计 ${totalMinutes} 分钟 · 悬停查看每日明细`}
          </p>
        </div>

        <SegmentedControl
          ariaLabel="选择统计天数"
          value={String(range)}
          onChange={(v) => {
            setHoveredIdx(null);
            onChangeRange(Number(v) as 7 | 30);
          }}
          options={[
            { value: '7', label: '近 7 天' },
            { value: '30', label: '近 30 天' },
          ]}
        />
      </div>

      <div className="mt-4 w-full flex-1 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-52 w-full min-w-[300px]"
          role="img"
          aria-label={`近 ${range} 天专注时长柱状图`}
        >
          <defs>
            <linearGradient id={`bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--accent-focus)' }} />
              <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--accent-focus) 58%, var(--accent-gold))' }} />
            </linearGradient>
            <linearGradient id={`bar-hi-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--accent-focus-hover)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-focus)' }} />
            </linearGradient>
          </defs>

          {/* Horizontal guides + Y-axis labels */}
          {[0, 0.5, 1].map((frac) => {
            const y = paddingTop + plotHeight * (1 - frac);
            const val = Math.round(maxMinutes * frac);
            return (
              <g key={frac}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={frac === 0 ? 'var(--border-strong)' : 'var(--border-subtle)'}
                  strokeDasharray={frac === 0 ? undefined : '3 4'}
                />
                <text
                  x={paddingLeft - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  className="tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {points.map((point, idx) => {
            const xCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
            const barH = point.minutes > 0 ? Math.max(5, (point.minutes / maxMinutes) * plotHeight) : 2.5;
            const y = paddingTop + plotHeight - barH;
            const isHovered = hoveredIdx === idx;
            const showLabel = range === 7 || idx % 5 === 0 || idx === points.length - 1;

            return (
              <g
                key={`${range}-${point.date}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={xCenter - slotWidth / 2}
                  y={paddingTop}
                  width={slotWidth}
                  height={plotHeight}
                  fill={isHovered ? 'color-mix(in srgb, var(--accent-focus-soft) 50%, transparent)' : 'transparent'}
                  rx="6"
                />
                <rect
                  x={xCenter - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={Math.min(6, barWidth / 2)}
                  fill={
                    point.minutes === 0
                      ? 'var(--bg-subtle)'
                      : isHovered
                        ? `url(#bar-hi-${uid})`
                        : `url(#bar-${uid})`
                  }
                  opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
                  className="bar-grow transition-opacity duration-150"
                  style={{ animationDelay: `${Math.min(idx * 18, 280)}ms` }}
                />
                {showLabel && (
                  <text
                    x={xCenter}
                    y={chartHeight - 7}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isHovered ? 600 : 400}
                    fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                    className="tabular-nums"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Floating tooltip bubble */}
          {hovered && (
            <g className="pointer-events-none">
              <rect
                x={tooltipX}
                y={4}
                width={tooltipW}
                height={24}
                rx={12}
                fill="var(--text-primary)"
              />
              <text
                x={tooltipX + tooltipW / 2}
                y={19.5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="var(--bg-surface)"
                className="tabular-nums"
              >
                {hovered.label} · {hovered.minutes} 分 ({hovered.count} 🍅)
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
