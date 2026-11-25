import { BarChart3, Clock3, Keyboard, Moon, Settings, Sun, Target } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export type ActiveTab = 'focus' | 'goals' | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

const NAV_ITEMS: Array<{ key: ActiveTab; label: string; icon: typeof Clock3 }> = [
  { key: 'focus', label: '今日专注', icon: Clock3 },
  { key: 'goals', label: '目标拆解', icon: Target },
  { key: 'analytics', label: '复盘统计', icon: BarChart3 },
];

export function Header({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenShortcuts,
}: HeaderProps) {
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
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-focus)] text-base text-white shadow-xs"
          >
            🍅
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-tight">番茄计划</h1>
            <p className="hidden text-[11px] text-[var(--text-muted)] leading-tight sm:block">
              Pomodoro Planner
            </p>
          </div>
        </div>

        <nav
          aria-label="主导航"
          className="hidden items-center gap-1 rounded-2xl bg-[var(--bg-subtle)] p-1 md:inline-flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="快捷键速查 (?)"
              aria-label="打开快捷键速查"
              className="focus-ring hidden h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:flex"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? '切换暖纸浅色' : '切换暖炭深色'}
            aria-label={isDark ? '切换至浅色暖纸主题' : '切换至深色暖炭主题'}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="设置与数据备份"
              aria-label="打开设置与数据备份"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
