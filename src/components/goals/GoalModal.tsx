import { useEffect, useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { GOAL_COLORS, type Goal } from '../../types';
import type { AddGoalInput } from '../../context/AppDataContext';

interface GoalModalProps {
  goal?: Goal | null;
  onClose: () => void;
  onSave: (input: AddGoalInput, existingId?: string) => void;
}

function clampTarget(n: number) {
  return Math.max(1, Math.min(999, Math.round(n) || 1));
}

export function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0].hex);
  const [targetDraft, setTargetDraft] = useState(String(goal?.targetPomodoros ?? 12));
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        targetPomodoros: clampTarget(Number(targetDraft)),
        deadline: deadline || undefined,
      },
      goal?.id,
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-scale-in w-full max-w-md rounded-[26px] p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <p className="font-serif-italic text-xs text-[var(--text-muted)]">
              {goal ? 'Edit Milestone' : 'New Milestone'}
            </p>
            <h3 id="goal-modal-title" className="text-base font-semibold">
              {goal ? '编辑阶段目标' : '新建阶段目标'}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭弹窗" className="focus-ring icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">目标名称</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：期末数据结构冲刺、英语六级阅读提升…"
              className="field w-full rounded-2xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">目标说明（可选）</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="写下里程碑或衡量标准…"
              className="field w-full resize-none rounded-2xl px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">标识色</span>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((swatch) => {
                const selected = color === swatch.hex;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setColor(swatch.hex)}
                    className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition ${
                      selected
                        ? 'border-[var(--text-primary)] bg-[var(--bg-subtle)] font-semibold text-[var(--text-primary)] shadow-2xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {selected && <Check className="h-2.5 w-2.5 stroke-[3] text-white" />}
                    </span>
                    {swatch.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">目标总番茄数</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                onBlur={() => setTargetDraft(String(clampTarget(Number(targetDraft))))}
                className="field num-display w-full rounded-xl px-3 py-2 text-sm !tracking-normal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">截止日期（可选）</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="field tabular-nums w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="focus-ring btn-soft h-9 px-4 text-sm">
              取消
            </button>
            <button type="submit" className="focus-ring btn-primary h-9 rounded-xl px-5 text-sm">
              {goal ? '保存目标' : '创建目标'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
