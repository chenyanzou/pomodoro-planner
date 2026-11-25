import { RotateCcw, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export function UndoToast() {
  const { toast, dismissToast } = useAppData();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-up fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm shadow-[var(--shadow-elevated)] lg:bottom-6"
    >
      <span className="text-[var(--text-primary)]">{toast.text}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        {toast.onUndo && (
          <button
            type="button"
            onClick={toast.onUndo}
            className="focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--accent-focus-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)] transition hover:opacity-90"
          >
            <RotateCcw className="h-3 w-3" />
            {toast.undoLabel ?? '撤销'}
          </button>
        )}
        <button
          type="button"
          onClick={dismissToast}
          aria-label="关闭提示"
          className="focus-ring rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
