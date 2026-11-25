import type { ReactNode } from 'react';

type Variant = 'schedule' | 'goals' | 'analytics' | 'filter';

interface EmptyStateProps {
  variant: Variant;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}

function Tomato({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="22" rx="18" ry="3" fill="var(--text-primary)" opacity="0.06" />
      <circle cx="0" cy="0" r="18" fill="var(--accent-focus)" />
      <path d="M-11 -6 a13 13 0 0 1 8 -8" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path
        d="M0 -17 l-7 -4 4 6 -7 1 7 2 -2 6 5 -5 5 5 -2 -6 7 -2 -7 -1 4 -6 z"
        fill="var(--accent-break)"
      />
      <path d="M0 -18 q1 -6 5 -8" stroke="var(--accent-break-deep)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Sparkle({ x, y, s = 1, delay = 0 }: { x: number; y: number; s?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 -6 C0.6 -1.2 1.2 -0.6 6 0 C1.2 0.6 0.6 1.2 0 6 C-0.6 1.2 -1.2 0.6 -6 0 C-1.2 -0.6 -0.6 -1.2 0 -6 Z"
        fill="var(--accent-gold)"
        className="animate-float"
        style={{ animationDelay: `${delay}s`, transformBox: 'fill-box' }}
      />
    </g>
  );
}

function Illustration({ variant }: { variant: Variant }) {
  if (variant === 'schedule') {
    return (
      <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
        <ellipse cx="100" cy="128" rx="70" ry="6" fill="var(--text-primary)" opacity="0.05" />
        <g transform="rotate(-4 100 70)">
          <rect x="48" y="22" width="104" height="100" rx="12" fill="var(--bg-surface)" stroke="var(--border-strong)" />
          <rect x="48" y="22" width="104" height="22" rx="12" fill="var(--accent-focus-soft)" />
          <rect x="48" y="36" width="104" height="8" fill="var(--accent-focus-soft)" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(62 ${58 + i * 20})`}>
              <rect width="10" height="10" rx="5" fill="none" stroke="var(--border-strong)" strokeWidth="1.6" />
              <rect x="18" y="2" width={i === 1 ? 46 : 62} height="6" rx="3" fill="var(--bg-subtle)" />
            </g>
          ))}
          <circle cx="66" cy="33" r="3" fill="var(--accent-focus)" opacity="0.6" />
          <circle cx="76" cy="33" r="3" fill="var(--accent-focus)" opacity="0.35" />
        </g>
        <g className="animate-float" style={{ transformBox: 'fill-box' }}>
          <Tomato x={150} y={104} s={0.95} />
        </g>
        <Sparkle x={40} y={34} s={0.9} />
        <Sparkle x={168} y={40} s={0.6} delay={1.2} />
        <Sparkle x={34} y={100} s={0.5} delay={2} />
      </svg>
    );
  }
  if (variant === 'goals') {
    return (
      <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
        <ellipse cx="100" cy="128" rx="78" ry="6" fill="var(--text-primary)" opacity="0.05" />
        <path d="M20 124 L82 46 L110 80 L132 56 L182 124 Z" fill="var(--bg-subtle)" stroke="var(--border-strong)" strokeLinejoin="round" />
        <path d="M82 46 L72 59 L80 56 L86 62 L92 55 Z" fill="var(--bg-surface)" opacity="0.9" />
        <path
          d="M40 120 C 60 112, 64 100, 78 96 S 104 92, 112 84 S 126 70, 132 60"
          fill="none"
          stroke="var(--accent-focus)"
          strokeWidth="2.2"
          strokeDasharray="1 7"
          strokeLinecap="round"
        />
        {[
          [40, 120],
          [78, 96],
          [112, 84],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="var(--accent-focus)" opacity={0.45 + i * 0.2} />
        ))}
        <g className="animate-float" style={{ transformBox: 'fill-box' }}>
          <line x1="132" y1="58" x2="132" y2="28" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M132 28 L154 34 L132 42 Z" fill="var(--accent-focus)" />
        </g>
        <Sparkle x={160} y={22} s={0.8} delay={0.6} />
        <Sparkle x={36} y={40} s={0.6} delay={1.6} />
      </svg>
    );
  }
  if (variant === 'analytics') {
    return (
      <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
        <ellipse cx="100" cy="128" rx="72" ry="6" fill="var(--text-primary)" opacity="0.05" />
        <line x1="40" y1="120" x2="164" y2="120" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        {[18, 32, 24, 46, 38, 62].map((h, i) => (
          <rect
            key={i}
            x={46 + i * 19}
            y={120 - h}
            width="12"
            height={h}
            rx="4"
            fill={i === 5 ? 'var(--accent-focus)' : 'var(--bg-subtle)'}
            stroke={i === 5 ? 'none' : 'var(--border-strong)'}
            className="bar-grow"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
        <g className="animate-float" style={{ transformBox: 'fill-box' }}>
          <path d="M147 58 C147 46 147 40 147 34" stroke="var(--accent-break)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M147 44 C 138 42, 134 34, 136 28 C 144 30, 148 36, 147 44 Z" fill="var(--accent-break)" />
          <path d="M147 38 C 156 36, 160 28, 158 22 C 150 24, 146 30, 147 38 Z" fill="var(--accent-break)" opacity="0.75" />
        </g>
        <Sparkle x={34} y={50} s={0.7} delay={0.8} />
        <Sparkle x={172} y={70} s={0.55} delay={1.8} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
      <ellipse cx="100" cy="126" rx="56" ry="5" fill="var(--text-primary)" opacity="0.05" />
      <circle cx="92" cy="64" r="30" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="3" />
      <circle cx="92" cy="64" r="20" fill="var(--bg-subtle)" />
      <line x1="114" y1="86" x2="138" y2="110" stroke="var(--text-secondary)" strokeWidth="7" strokeLinecap="round" />
      <Sparkle x={140} y={40} s={0.7} />
    </svg>
  );
}

export function EmptyState({ variant, title, description, actions, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`animate-fade-up relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-subtle)_35%,transparent)] text-center ${
        compact ? 'px-5 py-7' : 'px-6 py-10'
      }`}
    >
      <div className={compact ? 'h-24 w-36' : 'h-32 w-48'}>
        <Illustration variant={variant} />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
