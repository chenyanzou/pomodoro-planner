import { useState } from 'react';
import { Check, Pencil, Play, Trash2, X } from 'lucide-react';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onToggleComplete: (id: string) => void;
  onBind: (id: string) => void;
  onUpdate: (id: string, patch: { title: string; estimatedPomodoros: number }) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({
  task,
  isActive,
  onToggleComplete,
  onBind,
  onUpdate,
  onDelete,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftEstimate, setDraftEstimate] = useState(task.estimatedPomodoros);

  const handleSave = () => {
    if (!draftTitle.trim()) return;
    onUpdate(task.id, { title: draftTitle.trim(), estimatedPomodoros: draftEstimate });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-2xl border border-[var(--accent-focus)] bg-[var(--bg-surface)] p-3.5 shadow-xs">
        <input
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
          autoFocus
        />
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            预估番茄数
            <input
              type="number"
              min={1}
              max={16}
              value={draftEstimate}
              onChange={(e) => setDraftEstimate(Number(e.target.value) || 1)}
              className="tabular-nums w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-sm"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <X className="inline h-3.5 w-3.5" /> 取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
        isActive
          ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-soft)]/50'
          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
        className={`focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          task.completed
            ? 'border-[var(--accent-break)] bg-[var(--accent-break)] text-white'
            : 'border-[var(--border-strong)] hover:border-[var(--accent-focus)]'
        }`}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            task.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
          }`}
        >
          {task.title}
        </p>
      </div>

      <span className="tabular-nums shrink-0 rounded-lg bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
        🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {!task.completed && (
          <button
            type="button"
            onClick={() => onBind(task.id)}
            title="绑定到番茄钟"
            aria-label={`专注任务 ${task.title}`}
            className={`focus-ring flex h-8 w-8 items-center justify-center rounded-xl transition ${
              isActive
                ? 'bg-[var(--accent-focus)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-focus)]'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setDraftTitle(task.title);
            setDraftEstimate(task.estimatedPomodoros);
            setEditing(true);
          }}
          aria-label={`编辑任务 ${task.title}`}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`删除任务 ${task.title}`}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
