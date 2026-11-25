import { useId, type ReactNode } from 'react';

interface FocusDialProps {
  progress: number;
  isFocus: boolean;
  running: boolean;
  /** viewBox size; rendered size is controlled by className */
  className?: string;
  children?: ReactNode;
  tickCount?: number;
}

const VB = 300;
const C = VB / 2;

/**
 * Multi-layer ceremonial dial: breathing halo, minute ticks (lit as time elapses),
 * gradient progress arc and a glowing end bead. Pure SVG + CSS, no libs.
 */
export function FocusDial({
  progress,
  isFocus,
  running,
  className = 'h-64 w-64',
  children,
  tickCount = 60,
}: FocusDialProps) {
  const uid = useId().replace(/:/g, '');
  const accent = isFocus ? 'var(--accent-focus)' : 'var(--accent-break)';
  const accentDeep = isFocus ? 'var(--accent-focus-deep)' : 'var(--accent-break-deep)';
  const accentLight = isFocus
    ? 'color-mix(in srgb, var(--accent-focus) 62%, #ffd9b0)'
    : 'color-mix(in srgb, var(--accent-break) 62%, #e8f7c8)';

  const p = Math.min(1, Math.max(0, progress));
  const r = 112;
  const circ = 2 * Math.PI * r;
  const angle = p * 2 * Math.PI - Math.PI / 2;
  const beadX = C + r * Math.cos(angle);
  const beadY = C + r * Math.sin(angle);

  const tickOuter = 140;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const major = i % 5 === 0;
    const a = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
    const inner = tickOuter - (major ? 9 : 5);
    return {
      i,
      major,
      lit: i / tickCount < p,
      x1: C + inner * Math.cos(a),
      y1: C + inner * Math.sin(a),
      x2: C + tickOuter * Math.cos(a),
      y2: C + tickOuter * Math.sin(a),
    };
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" style={{ stopColor: accent, stopOpacity: 0 }} />
            <stop offset="78%" style={{ stopColor: accent, stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: accent, stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={`disc-${uid}`} cx="50%" cy="38%" r="62%">
            <stop offset="0%" style={{ stopColor: 'var(--bg-surface)' }} />
            <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--bg-subtle) 70%, var(--bg-surface))' }} />
          </radialGradient>
          <linearGradient id={`arc-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: accentLight }} />
            <stop offset="100%" style={{ stopColor: accentDeep }} />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Breathing halo */}
        <circle
          cx={C}
          cy={C}
          r={148}
          fill={`url(#halo-${uid})`}
          className={running ? 'dial-breath' : ''}
          style={{ opacity: running ? undefined : 0.25, transition: 'opacity 600ms ease' }}
        />

        {/* Minute ticks */}
        <g strokeLinecap="round">
          {ticks.map((t) => (
            <line
              key={t.i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.lit ? accent : 'var(--dial-tick)'}
              strokeOpacity={t.lit ? (t.major ? 0.95 : 0.6) : t.major ? 0.9 : 0.45}
              strokeWidth={t.major ? 2 : 1.2}
              style={{ transition: 'stroke 500ms ease' }}
            />
          ))}
        </g>

        {/* Inner disc */}
        <circle cx={C} cy={C} r={r - 12} fill={`url(#disc-${uid})`} />
        <circle cx={C} cy={C} r={r - 12} fill="none" stroke="var(--border-subtle)" />

        {/* Track */}
        <circle cx={C} cy={C} r={r} fill="none" stroke="var(--dial-track)" strokeWidth="9" />

        {/* Progress arc */}
        {p > 0.002 && (
          <circle
            cx={C}
            cy={C}
            r={r}
            fill="none"
            stroke={`url(#arc-${uid})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - p)}
            transform={`rotate(-90 ${C} ${C})`}
            style={{ transition: 'stroke-dashoffset 900ms var(--ease-out)' }}
          />
        )}

        {/* Glowing end bead */}
        <g style={{ transition: 'opacity 400ms ease' }} opacity={p > 0.002 || running ? 1 : 0.85}>
          <circle cx={beadX} cy={beadY} r={9} fill={accent} opacity={0.55} filter={`url(#glow-${uid})`} />
          <circle cx={beadX} cy={beadY} r={7.5} fill={accent} />
          <circle cx={beadX} cy={beadY} r={3} fill="#fff" />
        </g>
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
