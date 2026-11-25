import { Moon, Sun } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export function Header() {
  const { state, updateSettings } = useAppData();
  const isDark =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-focus)] text-base text-white shadow-sm"
          >
            🍅
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-tight">番茄计划</h1>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">Pomodoro Planner · v0.1</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? '切换至浅色暖纸主题' : '切换至深色暖炭主题'}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
