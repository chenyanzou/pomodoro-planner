import { BarChart3, Clock3, Keyboard, Moon, Settings, Sparkles, Sun, Target, X } from 'lucide-react';
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

export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bm-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent-focus)" />
          <stop offset="1" stopColor="var(--accent-focus-deep)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#bm-body)" />
      <rect x="1.5" y="1.5" width="37" height="37" rx="11.5" fill="none" stroke="#fff" strokeOpacity="0.18" />
      <circle cx="20" cy="22" r="10" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="2.4" />
      <path
        d="M20 12 a10 10 0 0 1 9.5 13"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="1.8" fill="#fff" />
      <path d="M20 22 L20 16.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 11.5 q-4 -4 -7 -2 q3 0.6 4.4 3 M20 11.5 q4 -4 7 -2 q-3 0.6 -4.4 3" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

export function Header({ activeTab, onSelectTab, onOpenSettings, onOpenShortcuts }: HeaderProps) {
  const { state, isDemoMode, toggleDemoMode, updateSettings } = useAppData();
  const isDark =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--border-subtle)_80%,transparent)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-9 w-9 shrink-0 drop-shadow-[0_4px_10px_color-mix(in_srgb,var(--accent-focus)_35%,transparent)]" />
          <div className="min-w-0 leading-none">
            <h1 className="whitespace-nowrap text-[15px] font-semibold tracking-[0.02em]">番茄计划</h1>
            <p className="font-serif-italic mt-1 hidden whitespace-nowrap text-[12px] text-[var(--text-muted)] sm:block">
              Pomodoro Planner
            </p>
          </div>
        </div>

        <nav aria-label="主导航" className="seg hidden md:inline-flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                aria-current={active ? 'page' : undefined}
                data-active={active}
                className="seg-item focus-ring inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px]"
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${active ? 'text-[var(--accent-focus)]' : ''}`}
                  strokeWidth={active ? 2.3 : 2}
                />
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
              className="focus-ring icon-btn hidden sm:inline-flex"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleDemoMode}
            title={isDemoMode ? '退出演示模式并恢复个人数据' : '进入演示模式（预览完整示例数据，不影响个人数据）'}
            aria-pressed={isDemoMode}
            className={`focus-ring group relative inline-flex h-9 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[0.8rem] border px-3 text-xs font-semibold transition-all duration-200 ${
              isDemoMode
                ? 'border-transparent bg-[var(--text-primary)] text-[var(--bg-surface)] hover:opacity-90'
                : 'border-[color-mix(in_srgb,var(--accent-gold)_45%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--accent-gold)_10%,var(--bg-surface))] text-[var(--text-primary)] hover:-translate-y-px hover:border-[var(--accent-gold)] hover:shadow-[0_6px_16px_-8px_var(--accent-gold)]'
            }`}
          >
            {isDemoMode ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>退出演示</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span>演示</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? '切换暖纸浅色' : '切换暗夜书房深色'}
            aria-label={isDark ? '切换至浅色暖纸主题' : '切换至深色暗夜书房主题'}
            className="focus-ring icon-btn overflow-hidden"
          >
            <span key={isDark ? 'sun' : 'moon'} className="animate-scale-in inline-flex">
              {isDark ? <Sun className="h-4 w-4 text-[var(--accent-gold)]" /> : <Moon className="h-4 w-4" />}
            </span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="设置与数据备份"
              aria-label="打开设置与数据备份"
              className="focus-ring icon-btn group"
            >
              <Settings className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
