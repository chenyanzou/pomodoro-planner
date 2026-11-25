import { useState, type FormEvent } from 'react';
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { useAppData, type AddGoalInput } from '../../context/AppDataContext';
import type { Goal, TimeSlot } from '../../types';
import { diffDays, toLocalDateKey } from '../../utils/date';
import { GoalModal } from './GoalModal';

interface GoalsViewProps {
  onJumpToSchedule: (dateKey: string) => void;
}

export function GoalsView({ onJumpToSchedule }: GoalsViewProps) {
  const {
    state,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalArchive,
    addTask,
    showToast,
  } = useAppData();

  const todayKey = toLocalDateKey();
  const [showArchived, setShowArchived] = useState(false);
  const [modalGoal, setModalGoal] = useState<Goal | null | undefined>(undefined);
  const [spawningGoalId, setSpawningGoalId] = useState<string | null>(null);
  const [spawnTitle, setSpawnTitle] = useState('');
  const [spawnDate, setSpawnDate] = useState(todayKey);
  const [spawnSlot, setSpawnSlot] = useState<TimeSlot>('morning');
  const [spawnEst, setSpawnEst] = useState(2);

  const visibleGoals = state.goals.filter((g) => g.archived === showArchived);
  const archivedCount = state.goals.filter((g) => g.archived).length;

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
      estimatedPomodoros: spawnEst,
    });
    setSpawnTitle('');
    setSpawningGoalId(null);
    showToast(`已将任务拆解到 ${spawnDate === todayKey ? '今天' : spawnDate} 的计划表`, {
      label: '去查看',
      onUndo: () => onJumpToSchedule(spawnDate),
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">阶段目标与任务拆解</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            将中长期目标拆解为可执行的每日番茄任务，自动汇总关联任务进度与专注时长。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            {showArchived ? (
              <>
                <Target className="h-3.5 w-3.5" />
                查看进行中
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" />
                已归档 ({archivedCount})
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalGoal(null)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-2xl bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-focus-hover)]"
          >
            <Plus className="h-4 w-4" />
            新建目标
          </button>
        </div>
      </div>

      {visibleGoals.length === 0 ? (
        <div className="paper-card rounded-3xl py-16 text-center">
          <Target className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {showArchived ? '当前没有已归档目标' : '还没有设定阶段目标，点击右上角「新建目标」开始拆解'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleGoals.map((goal) => {
            const linkedTasks = state.tasks.filter((t) => t.goalId === goal.id);
            const completedTasksCount = linkedTasks.filter((t) => t.completed).length;
            const completedPomodoros = linkedTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);
            const loggedMinutes = state.sessions
              .filter((s) => s.goalId === goal.id)
              .reduce((sum, s) => sum + s.durationMinutes, 0);
            const pct = Math.min(100, Math.round((completedPomodoros / Math.max(1, goal.targetPomodoros)) * 100));
            const daysLeft = goal.deadline ? diffDays(todayKey, goal.deadline) : null;

            return (
              <article
                key={goal.id}
                className="paper-card flex flex-col justify-between rounded-3xl p-5 sm:p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <div>
                        <h3 className="text-base font-semibold leading-snug">{goal.title}</h3>
                        {goal.description && (
                          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModalGoal(goal)}
                        aria-label={`编辑目标 ${goal.title}`}
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGoalArchive(goal.id)}
                        aria-label={goal.archived ? '恢复目标' : '归档目标'}
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      >
                        {goal.archived ? (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id)}
                        aria-label={`删除目标 ${goal.title}`}
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Stats */}
                  <div className="mt-4 rounded-2xl bg-[var(--bg-subtle)]/70 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-secondary)]">
                        任务进度 ·{' '}
                        <strong className="tabular-nums text-[var(--text-primary)]">
                          {completedPomodoros}/{goal.targetPomodoros}
                        </strong>{' '}
                        番茄（{pct}%）
                      </span>
                      <span className="tabular-nums text-[var(--text-secondary)]">
                        累计记录 <strong className="text-[var(--text-primary)]">{loggedMinutes}</strong> 分钟
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        关联任务 {completedTasksCount}/{linkedTasks.length} 已完成
                      </span>
                      {daysLeft !== null && (
                        <span className="tabular-nums inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {daysLeft > 0
                            ? `距截止还剩 ${daysLeft} 天（${goal.deadline}）`
                            : daysLeft === 0
                              ? '今天截止'
                              : `已超过截止日期 ${Math.abs(daysLeft)} 天`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Spawn Daily Task */}
                {!goal.archived && (
                  <div className="mt-4 border-t border-[var(--border-subtle)] pt-3.5">
                    {spawningGoalId === goal.id ? (
                      <form onSubmit={(e) => handleSpawnSubmit(e, goal)} className="space-y-2">
                        <input
                          type="text"
                          required
                          autoFocus
                          value={spawnTitle}
                          onChange={(e) => setSpawnTitle(e.target.value)}
                          placeholder="输入拆分后的具体执行任务..."
                          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <input
                            type="date"
                            required
                            value={spawnDate}
                            onChange={(e) => {
                              if (e.target.value) setSpawnDate(e.target.value);
                            }}
                            className="tabular-nums rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1"
                          />
                          <select
                            value={spawnSlot}
                            onChange={(e) => setSpawnSlot(e.target.value as TimeSlot)}
                            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1"
                          >
                            <option value="morning">上午</option>
                            <option value="afternoon">下午</option>
                            <option value="evening">晚上</option>
                            <option value="anytime">自由时段</option>
                          </select>
                          <label className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1">
                            🍅
                            <input
                              type="number"
                              min={1}
                              max={16}
                              value={spawnEst}
                              onChange={(e) =>
                                setSpawnEst(Math.max(1, Math.min(16, Number(e.target.value) || 1)))
                              }
                              className="tabular-nums w-8 bg-transparent text-center outline-none"
                            />
                          </label>
                          <div className="ml-auto flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSpawningGoalId(null)}
                              className="rounded-lg px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              className="rounded-lg bg-[var(--accent-focus)] px-3 py-1 font-medium text-white hover:opacity-90"
                            >
                              加入计划表
                            </button>
                          </div>
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
                          setSpawnEst(2);
                        }}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
                      >
                        <Plus className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
                        拆解为今日/指定日任务
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {modalGoal !== undefined && (
        <GoalModal
          goal={modalGoal}
          onClose={() => setModalGoal(undefined)}
          onSave={handleSaveGoal}
        />
      )}
    </div>
  );
}
