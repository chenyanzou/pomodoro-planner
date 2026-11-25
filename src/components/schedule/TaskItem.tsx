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

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: '高优先级', color: 'var(--accent-focus)' },
  medium: { label: '中优先级', color: 'var(--accent-gold)' },
  low: { label: '低优先级', color: 'var(--accent-break)' },
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
  const pomoSlots = Math.min(task.estimatedPomodoros, 8);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(task.id);
      }}
      onDragEnd={onDragEnd}
      data-active={isActive}
      data-dragging={!!isDragging}
      data-done={task.completed}
      className="task-card group flex min-w-0 items-start gap-2.5 overflow-hidden rounded-2xl py-3 pr-2 pl-3"
    >
      {/* priority spine */}
      <span
        aria-hidden="true"
        className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full transition-opacity"
        style={{ backgroundColor: prio.color, opacity: task.completed ? 0.25 : 0.85 }}
      />

      <div
        title="拖拽调整顺序或跨时段移动"
        className="mt-0.5 -ml-1 hidden cursor-grab text-[var(--text-muted)] opacity-0 transition group-hover:opacity-70 active:cursor-grabbing sm:flex"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
        data-checked={task.completed}
        className={`check-orb focus-ring relative mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          task.completed
            ? 'border-[var(--accent-break)] bg-[var(--accent-break)] text-[var(--on-accent)]'
            : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--accent-break)] hover:bg-[var(--accent-break-soft)]'
        }`}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[3.5]" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] leading-snug font-medium break-words transition-colors ${
            task.completed ? 'text-[var(--text-muted)] line-through decoration-[var(--border-strong)]' : 'text-[var(--text-primary)]'
          }`}
          title={prio.label}
        >
          {task.title}
        </p>

        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
          <span
            className="inline-flex items-center gap-[3px]"
            aria-label={`番茄 ${task.completedPomodoros}/${task.estimatedPomodoros}`}
            title={`番茄 ${task.completedPomodoros}/${task.estimatedPomodoros}`}
          >
            {Array.from({ length: pomoSlots }).map((_, i) => (
              <span
                key={i}
                className="h-[7px] w-[7px] rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i < task.completedPomodoros ? 'var(--accent-focus)' : 'transparent',
                  boxShadow: i < task.completedPomodoros ? 'none' : 'inset 0 0 0 1.3px var(--border-strong)',
                }}
              />
            ))}
            <span className="num-display ml-1 text-[11px] !tracking-normal">
              {task.completedPomodoros}/{task.estimatedPomodoros}
            </span>
          </span>
          {goal && (
            <span className="chip max-w-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
              <span className="min-w-0 truncate">{goal.title}</span>
            </span>
          )}
          {task.note && <span className="min-w-0 max-w-full truncate">{task.note}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {!task.completed && (
          <button
            type="button"
            onClick={() => onBind(task.id)}
            title="绑定到番茄钟"
            aria-label={`绑定任务 ${task.title} 到番茄钟`}
            className={`focus-ring flex h-8 w-8 items-center justify-center rounded-xl transition ${
              isActive
                ? 'btn-primary'
                : 'text-[var(--text-secondary)] hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]'
            }`}
          >
            <Play className="ml-px h-3.5 w-3.5 fill-current" />
          </button>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => onMove(task.id, 'up')}
            aria-label="上移任务"
            className="focus-ring flex h-6 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] disabled:opacity-25 sm:h-7 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:disabled:group-hover:opacity-25"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMove(task.id, 'down')}
            aria-label="下移任务"
            className="focus-ring flex h-6 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] disabled:opacity-25 sm:h-7 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:disabled:group-hover:opacity-25"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`编辑任务 ${task.title}`}
            className="focus-ring flex h-6 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] sm:h-8 sm:w-8 sm:rounded-xl"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`删除任务 ${task.title}`}
            className="focus-ring flex h-6 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)] sm:h-8 sm:w-8 sm:rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
