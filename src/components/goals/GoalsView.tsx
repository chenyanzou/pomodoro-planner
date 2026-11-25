import { useState, type FormEvent } from 'react';
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  CheckCircle2,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { useAppData, type AddGoalInput } from '../../context/AppDataContext';
import type { Goal, TimeSlot } from '../../types';
import { diffDays, toLocalDateKey } from '../../utils/date';
import { EmptyState } from '../ui/EmptyState';
import { SegmentedControl } from '../ui/SegmentedControl';
import { GoalModal } from './GoalModal';

interface GoalsViewProps {
  onJumpToSchedule: (dateKey: string) => void;
}

const SLOT_OPTIONS: Array<{ value: TimeSlot; label: string }> = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' },
  { value: 'anytime', label: '自由' },
];

function clampEst(n: number) {
  return Math.max(1, Math.min(16, Math.round(n) || 1));
}

export function GoalsView({ onJumpToSchedule }: GoalsViewProps) {
  const {
    state,
    isDemoMode,
    toggleDemoMode,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalArchive,
    addTask,
    showToast,
  } = useAppData();

  const todayKey = toLocalDateKey();
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [modalGoal, setModalGoal] = useState<Goal | null | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [spawningGoalId, setSpawningGoalId] = useState<string | null>(null);
  const [spawnTitle, setSpawnTitle] = useState('');
  const [spawnDate, setSpawnDate] = useState(todayKey);
  const [spawnSlot, setSpawnSlot] = useState<TimeSlot>('morning');
  const [spawnEst, setSpawnEst] = useState(2);
  const [spawnEstDraft, setSpawnEstDraft] = useState('2');

  const showArchived = viewMode === 'archived';
  const activeCount = state.goals.filter((g) => !g.archived).length;
  const archivedCount = state.goals.length - activeCount;
  const visibleGoals = state.goals.filter((g) => g.archived === showArchived);

  const setEst = (n: number) => {
    const v = clampEst(n);
    setSpawnEst(v);
    setSpawnEstDraft(String(v));
  };

  const handleSaveGoal = (input: AddGoalInput, existingId?: string) => {
    if (existingId) {
      updateGoal(existingId, input);
      showToast(`已更新目标「${input.title}」`);
    } else {
      addGoal(input);
      showToast(`已创建目标「${input.title}」`);
    }
  };

  const handleSpawnSubmit = (e: FormEvent, goal: Goal) => {
    e.preventDefault();
    if (!spawnTitle.trim()) return;
    addTask({
      title: spawnTitle,
      date: spawnDate,
      timeSlot: spawnSlot,
      priority: 'high',
      goalId: goal.id,
      estimatedPomodoros: clampEst(Number(spawnEstDraft)),
    });
    setSpawnTitle('');
    setSpawningGoalId(null);
    showToast(`已将任务拆解到 ${spawnDate === todayKey ? '今天' : spawnDate} 的计划表`, {
      label: '去查看',
      onUndo: () => onJumpToSchedule(spawnDate),
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3.5 py-5 sm:px-6 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif-italic text-[13px] text-[var(--text-muted)]">Milestones &amp; Breakdown</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">阶段目标与任务拆解</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            将中长期目标拆解为每日可执行的番茄任务，自动汇总关联进度与专注时长。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedControl
            ariaLabel="切换目标状态视图"
            value={viewMode}
            onChange={(v) => {
              setViewMode(v);
              setConfirmDeleteId(null);
            }}
            options={[
              {
                value: 'active',
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    进行中 <span className="tabular-nums opacity-60">{activeCount}</span>
                  </span>
                ),
              },
              {
                value: 'archived',
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5" />
                    已归档 <span className="tabular-nums opacity-60">{archivedCount}</span>
                  </span>
                ),
              },
            ]}
          />

          <button
            type="button"
            onClick={() => setModalGoal(null)}
            className="focus-ring btn-primary h-9 rounded-xl px-4 text-sm"
          >
            <Plus className="h-4 w-4" />
            新建目标
          </button>
        </div>
      </div>

      {visibleGoals.length === 0 ? (
        <EmptyState
          variant="goals"
          title={showArchived ? '还没有已归档的目标' : '还没有设定阶段目标'}
          description={
            showArchived
              ? '完成一个阶段性大目标后，可以点击卡片右上角的归档图标珍藏记录。'
              : '设定清晰的目标与预估番茄数，再把它拆解成每天的小步骤，每完成一颗番茄进度都会自动累计。'
          }
          actions={
            !showArchived ? (
              <>
                <button
                  type="button"
                  onClick={() => setModalGoal(null)}
                  className="focus-ring btn-primary h-9 rounded-xl px-4 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  新建第一个目标
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
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('active')}
                className="focus-ring btn-soft h-9 px-3.5 text-sm"
              >
                返回进行中
              </button>
            )
          }
        />
      ) : (
        <div className="stagger grid gap-5 md:grid-cols-2">
          {visibleGoals.map((goal) => {
            const linkedTasks = state.tasks.filter((t) => t.goalId === goal.id);
            const completedTasksCount = linkedTasks.filter((t) => t.completed).length;
            const completedPomodoros = linkedTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);
            const loggedMinutes = state.sessions
              .filter((s) => s.goalId === goal.id)
              .reduce((sum, s) => sum + s.durationMinutes, 0);
            const pct = Math.min(100, Math.round((completedPomodoros / Math.max(1, goal.targetPomodoros)) * 100));
            const daysLeft = goal.deadline ? diffDays(todayKey, goal.deadline) : null;
            const isConfirmingDelete = confirmDeleteId === goal.id;
            const ringR = 20;
            const ringC = 2 * Math.PI * ringR;

            return (
              <article
                key={goal.id}
                className="paper-card group flex min-w-0 flex-col justify-between overflow-hidden rounded-[26px]"
              >
                {/* subtle tinted top wash */}
                <div
                  aria-hidden="true"
                  className="h-1 w-full"
                  style={{ background: `linear-gradient(90deg, ${goal.color}, color-mix(in srgb, ${goal.color} 35%, transparent))` }}
                />

                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3.5">
                        {/* Mini progress ring */}
                        <div className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center">
                          <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden="true">
                            <circle cx="24" cy="24" r={ringR} fill="none" stroke="var(--bg-subtle)" strokeWidth="4" />
                            <circle
                              cx="24"
                              cy="24"
                              r={ringR}
                              fill="none"
                              stroke={goal.color}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={ringC}
                              strokeDashoffset={ringC * (1 - pct / 100)}
                              style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }}
                            />
                          </svg>
                          <span className="num-display absolute text-[11px] font-semibold !tracking-normal text-[var(--text-primary)]">
                            {pct}%
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-[16px] leading-snug font-semibold break-words text-[var(--text-primary)]">
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {isConfirmingDelete ? (
                          <div className="animate-scale-in flex items-center gap-1 rounded-xl border border-[color-mix(in_srgb,var(--accent-focus)_40%,transparent)] bg-[var(--accent-focus-soft)] p-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="focus-ring rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteGoal(goal.id);
                                setConfirmDeleteId(null);
                                showToast(`已删除目标「${goal.title}」`);
                              }}
                              className="focus-ring rounded-lg bg-[var(--accent-focus)] px-2 py-1 text-[11px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-focus-hover)]"
                            >
                              确认删
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalGoal(goal)}
                              aria-label={`编辑目标 ${goal.title}`}
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleGoalArchive(goal.id)}
                              aria-label={goal.archived ? '恢复目标' : '归档目标'}
                              title={goal.archived ? '恢复为进行中' : '归档目标'}
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            >
                              {goal.archived ? (
                                <ArchiveRestore className="h-3.5 w-3.5" />
                              ) : (
                                <Archive className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(goal.id)}
                              aria-label={`删除目标 ${goal.title}`}
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] p-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">
                          目标进度{' '}
                          <strong className="num-display text-sm font-semibold !tracking-normal text-[var(--text-primary)]">
                            {completedPomodoros}
                          </strong>
                          <span className="num-display !tracking-normal text-[var(--text-muted)]">
                            {' '}
                            / {goal.targetPomodoros}
                          </span>{' '}
                          番茄
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          累计专注{' '}
                          <strong className="num-display text-sm font-semibold !tracking-normal text-[var(--text-primary)]">
                            {loggedMinutes}
                          </strong>{' '}
                          分钟
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: goal.color }}
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: goal.color }} />
                          关联任务 {completedTasksCount}/{linkedTasks.length} 已完成
                        </span>
                        {daysLeft !== null && (
                          <span
                            className="chip"
                            style={{
                              backgroundColor:
                                daysLeft < 0
                                  ? 'var(--accent-focus-soft)'
                                  : daysLeft <= 3
                                    ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
                                    : 'var(--bg-surface)',
                              color:
                                daysLeft < 0
                                  ? 'var(--accent-focus)'
                                  : daysLeft <= 3
                                    ? 'var(--accent-gold)'
                                    : 'var(--text-secondary)',
                            }}
                          >
                            <CalendarClock className="h-3 w-3" />
                            <span className="tabular-nums">
                              {daysLeft > 0
                                ? `剩 ${daysLeft} 天 · ${goal.deadline}`
                                : daysLeft === 0
                                  ? '今天截止'
                                  : `已逾期 ${Math.abs(daysLeft)} 天`}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Spawn Daily Task */}
                  {!goal.archived && (
                    <div className="mt-4 border-t border-dashed border-[var(--border-subtle)] pt-3.5">
                      {spawningGoalId === goal.id ? (
                        <form onSubmit={(e) => handleSpawnSubmit(e, goal)} className="animate-fade-up space-y-2.5">
                          <input
                            type="text"
                            required
                            autoFocus
                            value={spawnTitle}
                            onChange={(e) => setSpawnTitle(e.target.value)}
                            placeholder="输入拆分后的具体执行任务…"
                            className="field w-full rounded-xl px-3.5 py-2 text-sm"
                          />
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <input
                              type="date"
                              required
                              value={spawnDate}
                              onChange={(e) => {
                                if (e.target.value) setSpawnDate(e.target.value);
                              }}
                              className="field tabular-nums h-8 rounded-xl px-2.5 text-xs"
                            />
                            <SegmentedControl
                              ariaLabel="选择拆解任务时段"
                              value={spawnSlot}
                              onChange={setSpawnSlot}
                              options={SLOT_OPTIONS}
                            />
                            <div className="inline-flex h-8 items-center gap-0.5 rounded-[0.8rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1 text-xs">
                              <button
                                type="button"
                                onClick={() => setEst(spawnEst - 1)}
                                aria-label="减少预估番茄"
                                className="focus-ring flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span aria-hidden="true">🍅</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={spawnEstDraft}
                                onChange={(e) => setSpawnEstDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                                onBlur={() => setEst(Number(spawnEstDraft))}
                                aria-label="预估番茄数"
                                className="num-display w-6 bg-transparent text-center text-xs font-semibold !tracking-normal text-[var(--text-primary)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setEst(spawnEst + 1)}
                                aria-label="增加预估番茄"
                                className="focus-ring flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setSpawningGoalId(null)}
                              className="focus-ring btn-soft h-8 px-3 text-xs"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              disabled={!spawnTitle.trim()}
                              className="focus-ring btn-primary h-8 rounded-xl px-3.5 text-xs disabled:opacity-40"
                            >
                              加入计划表
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSpawningGoalId(goal.id);
                            setSpawnTitle('');
                            setSpawnDate(todayKey);
                            setSpawnSlot('morning');
                            setEst(2);
                          }}
                          className="focus-ring btn-soft h-8 px-3 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
                          拆解为今日 / 指定日任务
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalGoal !== undefined && (
        <GoalModal goal={modalGoal} onClose={() => setModalGoal(undefined)} onSave={handleSaveGoal} />
      )}
    </div>
  );
}
