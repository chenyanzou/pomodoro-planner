import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Target, X } from 'lucide-react';
import type { Goal, Priority, Task, TimeSlot } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { SegmentedControl } from '../ui/SegmentedControl';

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
  { value: 'anytime', label: '自由' },
];

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'var(--accent-focus)',
  medium: 'var(--accent-gold)',
  low: 'var(--accent-break)',
};

function clampEst(n: number) {
  return Math.max(1, Math.min(16, Math.round(n) || 1));
}
function clampDone(n: number) {
  return Math.max(0, Math.min(99, Math.round(n) || 0));
}

export function TaskModal({ task, goals, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? '');
  const [date, setDate] = useState(task.date);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(task.timeSlot);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [goalId, setGoalId] = useState(task.goalId ?? '');
  const [estDraft, setEstDraft] = useState(String(task.estimatedPomodoros));
  const [doneDraft, setDoneDraft] = useState(String(task.completedPomodoros));

  const goalOptions = useMemo(
    () => [
      { value: '', label: '不关联目标', icon: <Target className="h-3.5 w-3.5 text-[var(--text-muted)]" /> },
      ...goals
        .filter((g) => !g.archived || g.id === goalId)
        .map((g) => ({ value: g.id, label: g.title, color: g.color })),
    ],
    [goals, goalId],
  );

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
      estimatedPomodoros: clampEst(Number(estDraft)),
      completedPomodoros: clampDone(Number(doneDraft)),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-scale-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <p className="font-serif-italic text-xs text-[var(--text-muted)]">Edit Task</p>
            <h3 id="task-modal-title" className="text-base font-semibold">
              编辑计划任务
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭弹窗" className="focus-ring icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">任务名称</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field w-full rounded-2xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">详细备注（可选）</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="补充完成标准、资料链接或拆分思路…"
              className="field w-full resize-none rounded-2xl px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">安排日期</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
                className="field tabular-nums h-9 w-full rounded-xl px-3 text-sm"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">所属目标</span>
              <Dropdown
                ariaLabel="所属目标"
                value={goalId}
                options={goalOptions}
                onChange={setGoalId}
                maxLabelWidth="12rem"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">时间段</span>
              <SegmentedControl ariaLabel="时间段" value={timeSlot} onChange={setTimeSlot} options={SLOT_OPTIONS} />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">优先级</span>
              <SegmentedControl
                ariaLabel="优先级"
                value={priority}
                onChange={setPriority}
                options={(['high', 'medium', 'low'] as Priority[]).map((p) => ({
                  value: p,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_DOT[p] }} />
                      {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                    </span>
                  ),
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">预估番茄数</label>
              <input
                type="text"
                inputMode="numeric"
                value={estDraft}
                onChange={(e) => setEstDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                onBlur={() => setEstDraft(String(clampEst(Number(estDraft))))}
                className="field num-display w-full rounded-xl px-3 py-2 text-sm !tracking-normal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">已完成番茄数</label>
              <input
                type="text"
                inputMode="numeric"
                value={doneDraft}
                onChange={(e) => setDoneDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                onBlur={() => setDoneDraft(String(clampDone(Number(doneDraft))))}
                className="field num-display w-full rounded-xl px-3 py-2 text-sm !tracking-normal"
              />
            </div>
          </div>

          <p className="rounded-xl bg-[color-mix(in_srgb,var(--bg-subtle)_55%,transparent)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
            说明：手动调整“已完成番茄数”仅更新任务进度显示，不会伪造带时间戳的历史专注流水；如需补录专注时长，请在「复盘统计」页面操作。
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="focus-ring btn-soft h-9 px-4 text-sm">
              取消
            </button>
            <button type="submit" className="focus-ring btn-primary h-9 rounded-xl px-5 text-sm">
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
