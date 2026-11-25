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
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-scale-in w-full max-w-md rounded-[26px] p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <p className="font-serif-italic text-xs text-[var(--text-muted)]">Keyboard Shortcuts</p>
            <h3 id="shortcuts-modal-title" className="text-base font-semibold">
              键盘快捷键速查
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭快捷键弹窗" className="focus-ring icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-3 divide-y divide-[var(--border-subtle)] text-sm">
          {SHORTCUTS.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[var(--text-secondary)]">{item.desc}</span>
              <kbd className="kbd min-w-[2.2rem] px-2">{item.key}</kbd>
            </li>
          ))}
        </ul>

        <p className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--bg-subtle)_55%,transparent)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
          提示：当光标位于文本输入框中或弹窗开启时，单键快捷键会自动暂停以避免误触。
        </p>
      </div>
    </div>
  );
}
