import { useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import {
  ArrowRightCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useTimer } from '../../context/TimerContext';
import type { Priority, Task, TimeSlot } from '../../types';
import {
  addDays,
  formatChineseDate,
  formatRelativeDayLabel,
  toLocalDateKey,
} from '../../utils/date';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';

interface SchedulePanelProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  quickInputRef?: RefObject<HTMLInputElement | null>;
}

const TIME_SLOTS: Array<{ key: TimeSlot; label: string; hint: string }> = [
  { key: 'morning', label: '上午', hint: '高精力深度任务' },
  { key: 'afternoon', label: '下午', hint: '推进与协作' },
  { key: 'evening', label: '晚上', hint: '复盘与轻度学习' },
  { key: 'anytime', label: '自由时段', hint: '灵活穿插' },
];

type StatusFilter = 'all' | 'todo' | 'done';

export function SchedulePanel({
  selectedDate,
  onSelectDate,
  quickInputRef,
}: SchedulePanelProps) {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    rolloverUnfinishedTasks,
    clearSampleData,
  } = useAppData();
  const { timerState, bindTask } = useTimer();

  const todayKey = toLocalDateKey();
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [priority, setPriority] = useState<Priority>('medium');
  const [goalId, setGoalId] = useState('');
  const [estimated, setEstimated] = useState(2);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<TimeSlot | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const goalMap = useMemo(() => new Map(state.goals.map((g) => [g.id, g])), [state.goals]);
  const activeGoals = useMemo(() => state.goals.filter((g) => !g.archived), [state.goals]);

  const dayTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => a.order - b.order),
    [state.tasks, selectedDate],
  );

  const filteredTasks = useMemo(
    () =>
      dayTasks.filter((t) => {
        if (statusFilter === 'todo' && t.completed) return false;
        if (statusFilter === 'done' && !t.completed) return false;
        if (goalFilter === 'none' && t.goalId) return false;
        if (goalFilter !== 'all' && goalFilter !== 'none' && t.goalId !== goalFilter) return false;
        return true;
      }),
    [dayTasks, statusFilter, goalFilter],
  );

  const dayFocusMinutes = useMemo(
    () =>
      state.sessions
        .filter((s) => s.date === selectedDate)
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [state.sessions, selectedDate],
  );

  const totalEst = dayTasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0);
  const totalDone = dayTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);
  const unfinishedCount = dayTasks.filter((t) => !t.completed).length;
  const progressPct = totalEst > 0 ? Math.min(100, Math.round((totalDone / totalEst) * 100)) : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      date: selectedDate,
      timeSlot,
      priority,
      goalId: goalId || undefined,
      estimatedPomodoros: estimated,
    });
    setTitle('');
    setEstimated(2);
  };

  const handleMove = (taskId: string, direction: 'up' | 'down') => {
    const ids = dayTasks.map((t) => t.id);
    const idx = ids.indexOf(taskId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    const nextIds = [...ids];
    [nextIds[idx], nextIds[swapIdx]] = [nextIds[swapIdx], nextIds[idx]];
    reorderTasks(selectedDate, nextIds);
  };

  const handleDragOverTask = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const targetTask = dayTasks.find((t) => t.id === targetId);
    const draggingTask = dayTasks.find((t) => t.id === draggingId);
    if (!targetTask || !draggingTask) return;

    const ids = dayTasks.map((t) => t.id).filter((id) => id !== draggingId);
    const targetIdx = ids.indexOf(targetId);
    ids.splice(targetIdx, 0, draggingId);
    const slotPatch =
      draggingTask.timeSlot !== targetTask.timeSlot
        ? { [draggingId]: targetTask.timeSlot }
        : undefined;
    reorderTasks(selectedDate, ids, slotPatch);
  };

  const handleDropOnSlot = (slot: TimeSlot) => {
    if (!draggingId) return;
    const draggingTask = dayTasks.find((t) => t.id === draggingId);
    if (draggingTask && draggingTask.timeSlot !== slot) {
      reorderTasks(
        selectedDate,
        dayTasks.map((t) => t.id),
        { [draggingId]: slot },
      );
    }
    setDragOverSlot(null);
    setDraggingId(null);
  };

  const rolloverLabel = selectedDate < todayKey ? '未完成顺延到今天' : '未完成顺延到明天';

  return (
    <section aria-label="计划安排表" className="paper-card rounded-3xl p-5 sm:p-6">
      {/* Date Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
            aria-label="前一天"
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="focus-ring relative flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition hover:bg-[var(--bg-subtle)]"
          >
            <Calendar className="h-4 w-4 text-[var(--accent-focus)]" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="tabular-nums text-sm font-semibold sm:text-base">
                  {formatChineseDate(selectedDate)}
                </span>
                <span className="rounded-md bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                  {formatRelativeDayLabel(selectedDate, todayKey)}
                </span>
              </div>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              aria-label="选择计划日期"
              className="sr-only"
            />
          </button>

          <button
            type="button"
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
            aria-label="后一天"
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {selectedDate !== todayKey && (
            <button
              type="button"
              onClick={() => onSelectDate(todayKey)}
              className="focus-ring ml-1 rounded-xl bg-[var(--accent-focus-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)] hover:opacity-90"
            >
              回到今天
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unfinishedCount > 0 && (
            <button
              type="button"
              onClick={() => rolloverUnfinishedTasks(selectedDate)}
              className="focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <ArrowRightCircle className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
              {rolloverLabel}
            </button>
          )}
          {state.hasSampleData && (
            <button
              type="button"
              onClick={clearSampleData}
              className="focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
              清空演示数据
            </button>
          )}
        </div>
      </div>

      {/* Day Progress Summary */}
      <div className="mt-4 rounded-2xl bg-[var(--bg-subtle)]/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-[var(--text-secondary)]">
            当日进度 · 计划{' '}
            <strong className="tabular-nums text-[var(--text-primary)]">
              {totalDone}/{totalEst}
            </strong>{' '}
            番茄
          </span>
          <span className="tabular-nums text-[var(--text-secondary)]">
            已记录专注 <strong className="text-[var(--accent-focus)]">{dayFocusMinutes}</strong> 分钟
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
          <div
            className="h-full rounded-full bg-[var(--accent-focus)] transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
        <div className="flex gap-2">
          <input
            ref={quickInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加新计划任务（按 N 快捷聚焦，回车保存）..."
            className="focus-ring min-w-0 flex-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)]"
          />
          <button
            type="submit"
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-focus-hover)]"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
            aria-label="选择时间段"
            className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)]"
          >
            {TIME_SLOTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            aria-label="选择优先级"
            className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)]"
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            aria-label="关联目标"
            className="focus-ring max-w-[170px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)]"
          >
            <option value="">不关联目标</option>
            {activeGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)]">
            🍅 预估
            <input
              type="number"
              min={1}
              max={16}
              value={estimated}
              onChange={(e) => setEstimated(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
              aria-label="预估番茄数"
              className="tabular-nums w-9 bg-transparent text-center font-medium text-[var(--text-primary)] outline-none"
            />
          </label>
        </div>
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3.5 text-xs">
        <div className="inline-flex rounded-xl bg-[var(--bg-subtle)] p-0.5">
          {(
            [
              { key: 'all', label: `全部 (${dayTasks.length})` },
              { key: 'todo', label: `待办 (${unfinishedCount})` },
              { key: 'done', label: `已完成 (${dayTasks.length - unfinishedCount})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`focus-ring rounded-lg px-2.5 py-1 font-medium transition ${
                statusFilter === item.key
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
          aria-label="按目标筛选"
          className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)]"
        >
          <option value="all">全部目标</option>
          <option value="none">未关联目标</option>
          {state.goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped Time Slots */}
      <div className="mt-4 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] py-10 text-center text-sm text-[var(--text-muted)]">
            {dayTasks.length === 0
              ? '这一天还没有安排计划，在上方输入任务或去「目标拆解」一键生成吧'
              : '当前筛选条件下没有匹配的任务'}
          </div>
        ) : (
          TIME_SLOTS.map((slot) => {
            const slotTasks = filteredTasks.filter((t) => t.timeSlot === slot.key);
            if (slotTasks.length === 0 && !draggingId) return null;

            return (
              <div
                key={slot.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(slot.key);
                }}
                onDragLeave={() => {
                  if (dragOverSlot === slot.key) setDragOverSlot(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnSlot(slot.key);
                }}
                className={`rounded-2xl transition ${
                  dragOverSlot === slot.key
                    ? 'bg-[var(--accent-focus-soft)]/50 p-2 ring-1 ring-[var(--accent-focus)]/40'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {slot.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{slot.hint}</span>
                  </div>
                  <span className="tabular-nums text-[11px] text-[var(--text-muted)]">
                    {slotTasks.length} 项
                  </span>
                </div>

                {slotTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-strong)] py-3 text-center text-xs text-[var(--text-muted)]">
                    拖拽任务到「{slot.label}」
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slotTasks.map((task) => {
                      const dayIdx = dayTasks.findIndex((t) => t.id === task.id);
                      return (
                        <TaskItem
                          key={task.id}
                          task={task}
                          goal={task.goalId ? goalMap.get(task.goalId) : undefined}
                          isActive={timerState.activeTaskId === task.id}
                          isDragging={draggingId === task.id}
                          canMoveUp={dayIdx > 0}
                          canMoveDown={dayIdx < dayTasks.length - 1}
                          onToggleComplete={toggleTaskComplete}
                          onBind={(id) => bindTask(id)}
                          onEdit={(t) => setEditingTask(t)}
                          onDelete={deleteTask}
                          onMove={handleMove}
                          onDragStart={(id) => setDraggingId(id)}
                          onDragOver={handleDragOverTask}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverSlot(null);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          goals={state.goals}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />
      )}
    </section>
  );
}
