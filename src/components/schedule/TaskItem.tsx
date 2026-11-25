import { ArrowDown, ArrowUp, Check, GripVertical, Pencil, Play, Trash2 } from 'lucide-react';
import type { Goal, Priority, Task } from '../../types';

interface TaskItemProps {
  task: Task;
  goal?: Goal;
  isActive: boolean;
  isDragging?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleComplete: (id: string) => void;
  onBind: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
}

const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  high: {
    label: '高',
    className: 'bg-[var(--accent-focus-soft)] text-[var(--accent-focus)]',
  },
  medium: {
    label: '中',
    className: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
  },
  low: {
    label: '低',
    className: 'bg-[var(--accent-break-soft)] text-[var(--accent-break)]',
  },
};

export function TaskItem({
  task,
  goal,
  isActive,
  isDragging,
  canMoveUp,
  canMoveDown,
  onToggleComplete,
  onBind,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: TaskItemProps) {
  const prio = PRIORITY_META[task.priority];

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(task.id);
      }}
      onDragEnd={onDragEnd}
      className={`group flex items-start gap-2.5 rounded-2xl border px-3 py-3 transition ${
        isDragging ? 'opacity-45 scale-[0.99]' : ''
      } ${
        isActive
          ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-soft)]/50'
          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
      }`}
    >
      <div
        title="拖拽调整顺序或跨时段移动"
        className="mt-0.5 hidden cursor-grab text-[var(--text-muted)] active:cursor-grabbing sm:flex"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
        className={`focus-ring mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          task.completed
            ? 'border-[var(--accent-break)] bg-[var(--accent-break)] text-white'
            : 'border-[var(--border-strong)] hover:border-[var(--accent-focus)]'
        }`}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${prio.className}`}>
            {prio.label}
          </span>
          <p
            className={`text-sm font-medium leading-snug ${
              task.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
            }`}
          >
            {task.title}
          </p>
        </div>

        {(task.note || goal) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            {goal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
                {goal.title}
              </span>
            )}
            {task.note && <span className="min-w-0 max-w-full truncate">{task.note}</span>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <span className="tabular-nums rounded-lg bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
        </span>

        <div className="flex items-center gap-0.5">
          {!task.completed && (
            <button
              type="button"
              onClick={() => onBind(task.id)}
              title="绑定到番茄钟"
              aria-label={`绑定任务 ${task.title} 到番茄钟`}
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
            disabled={!canMoveUp}
            onClick={() => onMove(task.id, 'up')}
            aria-label="上移任务"
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-70 transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] disabled:opacity-25 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMove(task.id, 'down')}
            aria-label="下移任务"
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-70 transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] disabled:opacity-25 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
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
    </div>
  );
}
