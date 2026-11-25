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
  const activeIdx = ITEMS.findIndex((i) => i.key === activeTab);
  return (
    <nav
      aria-label="移动端底部导航"
      className="fixed right-0 bottom-0 left-0 z-30 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="glass-bar relative mx-auto grid max-w-sm grid-cols-3 rounded-[22px] border border-[var(--border-subtle)] p-1.5 shadow-[var(--shadow-elevated)]">
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-1.5 rounded-2xl bg-[var(--bg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.15)] transition-transform duration-300"
          style={{
            width: 'calc((100% - 0.75rem) / 3)',
            transform: `translateX(${activeIdx * 100}%)`,
            transitionTimingFunction: 'var(--ease-out)',
          }}
        />
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring relative flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium transition-colors ${
                active ? 'text-[var(--accent-focus)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
