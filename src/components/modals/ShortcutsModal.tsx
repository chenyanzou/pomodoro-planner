import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: '开始 / 暂停番茄钟' },
  { key: 'R', desc: '重置当前阶段倒计时' },
  { key: 'N', desc: '快速聚焦新建任务输入框' },
  { key: 'F', desc: '进入 / 退出全屏沉浸专注模式' },
  { key: '1', desc: '切换至「今日专注」视图' },
  { key: '2', desc: '切换至「目标拆解」视图' },
  { key: '3', desc: '切换至「复盘统计」视图' },
  { key: '?', desc: '打开本快捷键速查弹窗' },
  { key: 'Esc', desc: '关闭弹窗或退出沉浸模式' },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-fade-up w-full max-w-md rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <h3 id="shortcuts-modal-title" className="text-base font-semibold">
            键盘快捷键速查
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭快捷键弹窗"
            className="focus-ring rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 divide-y divide-[var(--border-subtle)] text-sm">
          {SHORTCUTS.map((item) => (
            <li key={item.key} className="flex items-center justify-between py-2.5">
              <span className="text-[var(--text-secondary)]">{item.desc}</span>
              <kbd className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--text-primary)]">
                {item.key}
              </kbd>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[11px] text-[var(--text-muted)]">
          提示：当光标位于文本输入框中时，单键快捷键会自动暂停以避免误触。
        </p>
      </div>
    </div>
  );
}
