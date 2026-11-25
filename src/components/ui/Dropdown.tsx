import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  /** Optional leading swatch color (e.g. goal color) */
  color?: string;
  icon?: ReactNode;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  leading?: ReactNode;
  className?: string;
  menuAlign?: 'left' | 'right';
  maxLabelWidth?: string;
  placement?: 'bottom' | 'top';
}

/**
 * Lightweight custom select (listbox) — replaces native <select> chrome with a pill trigger
 * and a floating, keyboard-navigable menu. No dependencies.
 */
export function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  leading,
  className = '',
  menuAlign = 'left',
  maxLabelWidth = '9.5rem',
  placement = 'bottom',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  const openMenu = () => {
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const commit = (idx: number) => {
    const opt = options[idx];
    if (opt) onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(highlight);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`focus-ring btn-soft h-8 px-2.5 text-xs ${open ? 'border-[var(--border-strong)] text-[var(--text-primary)]' : ''}`}
      >
        {leading}
        {selected?.color && (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
        )}
        {selected?.icon}
        <span className="truncate" style={{ maxWidth: maxLabelWidth }}>
          {selected?.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`animate-scale-in absolute z-40 ${placement === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'}  max-h-64 min-w-[11rem] max-w-[16rem] overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-elevated)] ${
            menuAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt, idx) => {
            const isSel = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSel}
                onPointerEnter={() => setHighlight(idx)}
                onClick={() => commit(idx)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                  idx === highlight ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {opt.color ? (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
                ) : (
                  opt.icon
                )}
                <span className={`min-w-0 flex-1 truncate ${isSel ? 'font-semibold text-[var(--text-primary)]' : ''}`}>
                  {opt.label}
                </span>
                {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-focus)]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
