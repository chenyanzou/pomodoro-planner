import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Goal, Priority, Task, TimeSlot } from '../../types';

interface TaskModalProps {
  task: Task;
  goals: Goal[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
}

const SLOT_OPTIONS: Array<{ value: TimeSlot; label: string }> = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' },
  { value: 'anytime', label: '自由时段' },
];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
];

export function TaskModal({ task, goals, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? '');
  const [date, setDate] = useState(task.date);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(task.timeSlot);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [goalId, setGoalId] = useState(task.goalId ?? '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task.estimatedPomodoros);
  const [completedPomodoros, setCompletedPomodoros] = useState(task.completedPomodoros);

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
    onSave(task.id, {
      title: title.trim(),
      note: note.trim() || undefined,
      date,
      timeSlot,
      priority,
      goalId: goalId || undefined,
      estimatedPomodoros,
      completedPomodoros,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-fade-up w-full max-w-lg rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <h3 id="task-modal-title" className="text-base font-semibold">
            编辑计划任务
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
              任务名称
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-ring w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              详细备注（可选）
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="补充完成标准、资料链接或拆分思路..."
              className="focus-ring w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                安排日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                时间段
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                {SLOT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                所属目标
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                <option value="">不关联目标</option>
                {goals
                  .filter((g) => !g.archived || g.id === goalId)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                预估番茄数
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
                className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                已完成番茄数
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={completedPomodoros}
                onChange={(e) => setCompletedPomodoros(Math.max(0, Number(e.target.value) || 0))}
                className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            说明：手动调整“已完成番茄数”仅更新任务进度显示，不会伪造带时间戳的历史专注流水；如需补录专注时长，请在「复盘统计」页面操作。
          </p>

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
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
