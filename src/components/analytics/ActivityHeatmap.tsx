import { useState } from 'react';
import type { HeatmapCell } from '../../utils/analytics';

interface ActivityHeatmapProps {
  weeks: HeatmapCell[][];
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'var(--bg-subtle)',
  1: 'color-mix(in srgb, var(--accent-focus) 25%, var(--bg-subtle))',
  2: 'color-mix(in srgb, var(--accent-focus) 50%, var(--bg-subtle))',
  3: 'color-mix(in srgb, var(--accent-focus) 75%, var(--bg-subtle))',
  4: 'var(--accent-focus)',
};

const WEEKDAY_LABELS = ['一', '', '三', '', '五', '', '日'];

export function ActivityHeatmap({ weeks }: ActivityHeatmapProps) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  return (
    <section className="paper-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">近 12 周专注热力图</h3>
          <p className="tabular-nums text-xs text-[var(--text-muted)]">
            {hovered
              ? `${hovered.date} · 专注 ${hovered.minutes} 分钟`
              : '每个方格代表一天，颜色越深表示当日专注时长越高'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <span>少</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className="h-3 w-3 rounded-[4px]"
              style={{ backgroundColor: LEVEL_COLORS[lvl] }}
            />
          ))}
          <span>多</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-flex items-start gap-2">
          <div className="grid grid-rows-7 gap-1.5 pt-0.5 text-[10px] text-[var(--text-muted)]">
            {WEEKDAY_LABELS.map((label, idx) => (
              <span key={idx} className="flex h-3.5 w-3 items-center justify-center">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                {week.map((cell) => (
                  <button
                    key={cell.date}
                    type="button"
                    onMouseEnter={() => setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(cell)}
                    aria-label={`${cell.date} 专注 ${cell.minutes} 分钟`}
                    className="h-3.5 w-3.5 rounded-[4px] transition-transform hover:scale-125"
                    style={{ backgroundColor: LEVEL_COLORS[cell.level] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
