import { useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import {
  ArrowRightCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Moon,
  Plus,
  Shuffle,
  Sparkles,
  Sun,
  Sunset,
  Target,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useTimerActions } from '../../context/TimerContext';
import type { Priority, Task, TimeSlot } from '../../types';
import { addDays, formatChineseDate, formatRelativeDayLabel, toLocalDateKey } from '../../utils/date';
import { computeDragReorder, computeSlotMove } from '../../utils/reorder';
import { Dropdown } from '../ui/Dropdown';
import { EmptyState } from '../ui/EmptyState';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';

interface SchedulePanelProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  quickInputRef?: RefObject<HTMLInputElement | null>;
}

const TIME_SLOTS: Array<{ key: TimeSlot; label: string; hint: string; icon: typeof Sun }> = [
  { key: 'morning', label: '上午', hint: '高精力深度任务', icon: Sun },
  { key: 'afternoon', label: '下午', hint: '推进与协作', icon: Sunset },
  { key: 'evening', label: '晚上', hint: '复盘与轻度学习', icon: Moon },
  { key: 'anytime', label: '自由时段', hint: '灵活穿插', icon: Shuffle },
];

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'var(--accent-focus)',
  medium: 'var(--accent-gold)',
  low: 'var(--accent-break)',
};

type StatusFilter = 'all' | 'todo' | 'done';

function clampEst(n: number) {
  return Math.max(1, Math.min(16, Math.round(n) || 1));
}

export function SchedulePanel({ selectedDate, onSelectDate, quickInputRef }: SchedulePanelProps) {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    rolloverUnfinishedTasks,
    isDemoMode,
    toggleDemoMode,
  } = useAppData();
  const { activeTaskId, bindTask } = useTimerActions();

  const todayKey = toLocalDateKey();
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [priority, setPriority] = useState<Priority>('medium');
  const [goalId, setGoalId] = useState('');
  const [estimated, setEstimated] = useState(2);
  const [estDraft, setEstDraft] = useState('2');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<TimeSlot | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const goalMap = useMemo(() => new Map(state.goals.map((g) => [g.id, g])), [state.goals]);
  const activeGoals = useMemo(() => state.goals.filter((g) => !g.archived), [state.goals]);

  const dayTasks = useMemo(
    () => state.tasks.filter((t) => t.date === selectedDate).sort((a, b) => a.order - b.order),
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
      state.sessions.filter((s) => s.date === selectedDate).reduce((sum, s) => sum + s.durationMinutes, 0),
    [state.sessions, selectedDate],
  );

  const totalEst = dayTasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0);
  const totalDone = dayTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);
  const unfinishedCount = dayTasks.filter((t) => !t.completed).length;
  const doneCount = dayTasks.length - unfinishedCount;
  const progressPct = totalEst > 0 ? Math.min(100, Math.round((totalDone / totalEst) * 100)) : 0;

  const setEst = (n: number) => {
    const v = clampEst(n);
    setEstimated(v);
    setEstDraft(String(v));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      date: selectedDate,
      timeSlot,
      priority,
      goalId: goalId || undefined,
      estimatedPomodoros: clampEst(Number(estDraft)),
    });
    setTitle('');
    setEst(2);
  };

  const handleMove = (taskId: string, direction: 'up' | 'down') => {
    const nextIds = computeSlotMove(dayTasks, taskId, direction);
    if (nextIds) reorderTasks(selectedDate, nextIds);
  };

  const handleDragOverTask = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const result = computeDragReorder(dayTasks, draggingId, targetId);
    if (result) reorderTasks(selectedDate, result.orderedIds, result.slotPatch);
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

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') el.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };

  const rolloverLabel = selectedDate < todayKey ? '未完成顺延到今天' : '未完成顺延到明天';
  const goalOptions = [
    { value: '', label: '不关联目标', icon: <Target className="h-3.5 w-3.5 text-[var(--text-muted)]" /> },
    ...activeGoals.map((g) => ({ value: g.id, label: g.title, color: g.color })),
  ];
  const goalFilterOptions = [
    { value: 'all', label: '全部目标' },
    { value: 'none', label: '未关联目标' },
    ...state.goals.map((g) => ({ value: g.id, label: g.title, color: g.color })),
  ];

  return (
    <section aria-label="计划安排表" className="paper-card rounded-[28px] p-4 sm:p-6">
      {/* Header: date navigation */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif-italic text-[13px] text-[var(--text-muted)]">Today&rsquo;s Plan</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={openDatePicker}
                aria-label="选择计划日期"
                className="focus-ring group -mx-1 flex items-center gap-2 rounded-xl px-1 py-0.5 text-left transition hover:bg-[var(--bg-subtle)]"
              >
                <span className="num-display text-[22px] font-semibold !tracking-[-0.02em] sm:text-2xl">
                  {formatChineseDate(selectedDate)}
                </span>
                <CalendarDays className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--accent-focus)]" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  if (e.target.value) onSelectDate(e.target.value);
                }}
                className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
              />
            </div>
            <span
              className="chip"
              style={{
                backgroundColor: selectedDate === todayKey ? 'var(--accent-focus-soft)' : 'var(--bg-subtle)',
                color: selectedDate === todayKey ? 'var(--accent-focus)' : 'var(--text-secondary)',
              }}
            >
              {formatRelativeDayLabel(selectedDate, todayKey)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedDate !== todayKey && (
            <button
              type="button"
              onClick={() => onSelectDate(todayKey)}
              className="focus-ring animate-fade-in btn-soft h-8 px-2.5 text-xs !text-[var(--accent-focus)]"
            >
              回到今天
            </button>
          )}
          <div className="seg">
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, -1))}
              aria-label="前一天"
              className="seg-item focus-ring flex h-7 w-8 items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, 1))}
              aria-label="后一天"
              className="seg-item focus-ring flex h-7 w-8 items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day progress */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: '番茄进度', value: `${totalDone}`, unit: `/ ${totalEst}`, tone: 'var(--accent-focus)' },
          { label: '已专注', value: `${dayFocusMinutes}`, unit: '分钟', tone: 'var(--text-primary)' },
          { label: '任务完成', value: `${doneCount}`, unit: `/ ${dayTasks.length}`, tone: 'var(--accent-break)' },
        ].map((s) => (
          <div
            key={s.label}
            className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] px-3 py-2.5"
          >
            <p className="truncate text-[11px] text-[var(--text-muted)]">{s.label}</p>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="num-display text-xl font-semibold !tracking-[-0.03em]" style={{ color: s.tone }}>
                {s.value}
              </span>
              <span className="truncate text-[11px] text-[var(--text-muted)]">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-focus))',
          }}
        />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="field mt-4 rounded-[20px] p-2 focus-within:!shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-focus)_12%,transparent)]"
      >
        <div className="flex items-center gap-2">
          <span className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-focus-soft)] text-[var(--accent-focus)]">
            <Plus className="h-4 w-4" />
          </span>
          <input
            ref={quickInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="写下一个新计划，回车保存…"
            aria-label="新计划任务标题"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="kbd mr-1 hidden sm:inline-flex">N</kbd>
          <button
            type="submit"
            disabled={!title.trim()}
            className="focus-ring btn-primary h-9 shrink-0 rounded-xl px-4 text-sm disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
          >
            添加
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-dashed border-[var(--border-subtle)] px-1 pt-2">
          <SegmentedControl
            ariaLabel="选择时间段"
            value={timeSlot}
            onChange={setTimeSlot}
            options={TIME_SLOTS.map((s) => ({ value: s.key, label: s.key === 'anytime' ? '自由' : s.label }))}
          />
          <SegmentedControl
            ariaLabel="选择优先级"
            value={priority}
            onChange={setPriority}
            options={(['high', 'medium', 'low'] as Priority[]).map((p) => ({
              value: p,
              title: `${p === 'high' ? '高' : p === 'medium' ? '中' : '低'}优先级`,
              label: (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_DOT[p] }} />
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </span>
              ),
            }))}
          />
          <Dropdown ariaLabel="关联目标" value={goalId} options={goalOptions} onChange={setGoalId} maxLabelWidth="7.5rem" />
          <div className="inline-flex h-8 items-center gap-0.5 rounded-[0.8rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1 text-xs text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setEst(estimated - 1)}
              aria-label="减少预估番茄"
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-lg transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span aria-hidden="true">🍅</span>
            <input
              type="text"
              inputMode="numeric"
              value={estDraft}
              onChange={(e) => setEstDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
              onBlur={() => setEst(Number(estDraft))}
              aria-label="预估番茄数"
              className="num-display w-6 bg-transparent text-center text-[13px] font-semibold !tracking-normal text-[var(--text-primary)] outline-none"
            />
            <button
              type="button"
              onClick={() => setEst(estimated + 1)}
              aria-label="增加预估番茄"
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-lg transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          ariaLabel="按状态筛选"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: <>全部 <span className="tabular-nums opacity-60">{dayTasks.length}</span></> },
            { value: 'todo', label: <>待办 <span className="tabular-nums opacity-60">{unfinishedCount}</span></> },
            { value: 'done', label: <>已完成 <span className="tabular-nums opacity-60">{doneCount}</span></> },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {unfinishedCount > 0 && (
            <button
              type="button"
              onClick={() => rolloverUnfinishedTasks(selectedDate)}
              className="focus-ring btn-soft h-8 px-2.5 text-xs"
            >
              <ArrowRightCircle className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
              {rolloverLabel}
            </button>
          )}
          <Dropdown
            ariaLabel="按目标筛选"
            value={goalFilter}
            options={goalFilterOptions}
            onChange={setGoalFilter}
            menuAlign="right"
            maxLabelWidth="7rem"
          />
        </div>
      </div>

      {/* Time slots */}
      <div className="mt-4 space-y-5">
        {filteredTasks.length === 0 ? (
          dayTasks.length === 0 ? (
            <EmptyState
              variant="schedule"
              title={selectedDate === todayKey ? '今天的纸面还是空白的' : '这一天还没有安排'}
              description="把想做的事写下来，用番茄一颗颗完成它。也可以去「目标拆解」一键生成每日计划。"
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => quickInputRef?.current?.focus()}
                    className="focus-ring btn-primary h-9 rounded-xl px-4 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    写下第一个计划
                  </button>
                  {!isDemoMode && (
                    <button
                      type="button"
                      onClick={toggleDemoMode}
                      className="focus-ring btn-soft h-9 px-3.5 text-sm"
                    >
                      <Sparkles className="h-4 w-4 text-[var(--accent-gold)]" />
                      看看演示
                    </button>
                  )}
                </>
              }
            />
          ) : (
            <EmptyState
              compact
              variant="filter"
              title="没有匹配的任务"
              description="换个筛选条件试试。"
              actions={
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setGoalFilter('all');
                  }}
                  className="focus-ring btn-soft h-8 px-3 text-xs"
                >
                  清除筛选
                </button>
              }
            />
          )
        ) : (
          TIME_SLOTS.map((slot) => {
            const slotTasks = filteredTasks.filter((t) => t.timeSlot === slot.key);
            if (slotTasks.length === 0 && !draggingId) return null;
            const SlotIcon = slot.icon;

            return (
              <div
                key={slot.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(slot.key);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node) && dragOverSlot === slot.key) {
                    setDragOverSlot(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnSlot(slot.key);
                }}
                className={`rounded-2xl transition-all duration-200 ${
                  dragOverSlot === slot.key
                    ? 'bg-[color-mix(in_srgb,var(--accent-focus-soft)_60%,transparent)] p-2 ring-1 ring-[color-mix(in_srgb,var(--accent-focus)_40%,transparent)]'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <SlotIcon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-gold)]" />
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{slot.label}</span>
                    <span className="truncate text-[11px] text-[var(--text-muted)]">{slot.hint}</span>
                  </div>
                  <span className="num-display shrink-0 text-[11px] !tracking-normal text-[var(--text-muted)]">
                    {slotTasks.length} 项
                  </span>
                </div>

                {slotTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-strong)] py-3 text-center text-xs text-[var(--text-muted)]">
                    拖拽任务到「{slot.label}」
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slotTasks.map((task, slotIdx) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        goal={task.goalId ? goalMap.get(task.goalId) : undefined}
                        isActive={activeTaskId === task.id}
                        isDragging={draggingId === task.id}
                        canMoveUp={slotIdx > 0}
                        canMoveDown={slotIdx < slotTasks.length - 1}
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
                    ))}
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
