import { RotateCcw, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export function UndoToast() {
  const { toast, dismissToast } = useAppData();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-8"
    >
      <div className="animate-scale-in flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-[var(--text-primary)] py-2.5 pr-2 pl-4 text-sm text-[var(--bg-surface)] shadow-[var(--shadow-elevated)]">
        <span className="min-w-0">{toast.text}</span>
        <div className="flex shrink-0 items-center gap-1">
          {toast.onUndo && (
            <button
              type="button"
              onClick={toast.onUndo}
              className="focus-ring inline-flex items-center gap-1 rounded-xl bg-[color-mix(in_srgb,var(--bg-surface)_14%,transparent)] px-2.5 py-1.5 text-xs font-semibold text-[var(--bg-surface)] transition hover:bg-[color-mix(in_srgb,var(--bg-surface)_24%,transparent)]"
            >
              <RotateCcw className="h-3 w-3" />
              {toast.undoLabel ?? '撤销'}
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            aria-label="关闭提示"
            className="focus-ring rounded-lg p-1.5 opacity-60 transition hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
