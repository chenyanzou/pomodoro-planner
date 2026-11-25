import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { GOAL_COLORS, type Goal } from '../../types';
import type { AddGoalInput } from '../../context/AppDataContext';

interface GoalModalProps {
  goal?: Goal | null;
  onClose: () => void;
  onSave: (input: AddGoalInput, existingId?: string) => void;
}

export function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0].hex);
  const [targetPomodoros, setTargetPomodoros] = useState(goal?.targetPomodoros ?? 12);
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
        targetPomodoros,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-fade-up w-full max-w-md rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <h3 id="goal-modal-title" className="text-base font-semibold">
            {goal ? '编辑阶段目标' : '新建阶段目标'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭弹窗"
            className="focus-ring rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              目标名称
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：期末数据结构冲刺、英语六级阅读提升..."
              className="focus-ring w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              目标说明（可选）
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="写下里程碑或衡量标准..."
              className="focus-ring w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
              标识色
            </span>
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
                        ? 'border-[var(--text-primary)] bg-[var(--bg-subtle)] font-medium'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    {swatch.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                目标总番茄数
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={targetPomodoros}
                onChange={(e) =>
                  setTargetPomodoros(Math.max(1, Math.min(999, Number(e.target.value) || 1)))
                }
                className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                截止日期（可选）
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-2xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              取消
            </button>
            <button
              type="submit"
              className="focus-ring rounded-2xl bg-[var(--accent-focus)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-focus-hover)]"
            >
              {goal ? '保存目标' : '创建目标'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
