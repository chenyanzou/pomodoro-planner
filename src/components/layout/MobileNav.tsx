import { BarChart3, Clock3, Target } from 'lucide-react';
import type { ActiveTab } from './Header';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

const ITEMS: Array<{ key: ActiveTab; label: string; icon: typeof Clock3 }> = [
  { key: 'focus', label: '今日专注', icon: Clock3 },
  { key: 'goals', label: '目标拆解', icon: Target },
  { key: 'analytics', label: '复盘统计', icon: BarChart3 },
];

export function MobileNav({ activeTab, onSelectTab }: MobileNavProps) {
  return (
    <nav
      aria-label="移动端底部导航"
      className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 px-2 py-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition ${
                active ? 'text-[var(--accent-focus)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
