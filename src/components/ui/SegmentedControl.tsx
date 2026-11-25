import type { ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<SegmentOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
  /** Use tablist semantics (e.g. timer phases) instead of a radio-style button group */
  asTabs?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'sm',
  className = '',
  asTabs = false,
}: SegmentedControlProps<T>) {
  const pad = size === 'md' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <div role={asTabs ? 'tablist' : 'radiogroup'} aria-label={ariaLabel} className={`seg ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role={asTabs ? 'tab' : 'radio'}
            aria-selected={asTabs ? active : undefined}
            aria-checked={asTabs ? undefined : active}
            title={opt.title}
            data-active={active}
            onClick={() => onChange(opt.value)}
            className={`seg-item focus-ring ${pad}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
