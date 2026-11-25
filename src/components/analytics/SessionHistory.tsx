import { useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Pencil, Plus, Sparkles, Target, Trash2, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import type { FocusSession } from '../../types';
import { formatTimeClock, toLocalDateKey } from '../../utils/date';
import { Dropdown } from '../ui/Dropdown';
import { EmptyState } from '../ui/EmptyState';

function clampMinutes(n: number) {
  return Math.max(1, Math.min(240, Math.round(n) || 1));
}

export function SessionHistory() {
  const { state, isDemoMode, toggleDemoMode, addManualSession, updateFocusSession, deleteFocusSession } =
    useAppData();

  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addGoalId, setAddGoalId] = useState('');
  const [addDate, setAddDate] = useState(() => toLocalDateKey());
  const [addMinutesDraft, setAddMinutesDraft] = useState('25');
  const [addNote, setAddNote] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMinutesDraft, setEditMinutesDraft] = useState('25');
  const [editNote, setEditNote] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(20);

  const sortedSessions = useMemo(
    () =>
      [...state.sessions].sort(
        (a, b) => b.date.localeCompare(a.date) || b.endedAt - a.endedAt,
      ),
    [state.sessions],
  );

  const goalOptions = useMemo(
    () => [
      { value: '', label: '不关联目标（日常零散专注）', icon: <Target className="h-3.5 w-3.5 text-[var(--text-muted)]" /> },
      ...state.goals.map((g) => ({ value: g.id, label: g.title, color: g.color })),
    ],
    [state.goals],
  );

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) return;
    addManualSession({
      taskTitleSnapshot: addTitle,
      goalId: addGoalId || undefined,
      durationMinutes: clampMinutes(Number(addMinutesDraft)),
      date: addDate,
      note: addNote,
    });
    setAddTitle('');
    setAddNote('');
    setAddMinutesDraft('25');
    setShowAdd(false);
  };

  const startEdit = (session: FocusSession) => {
    setEditingId(session.id);
    setEditTitle(session.taskTitleSnapshot);
    setEditMinutesDraft(String(session.durationMinutes));
    setEditNote(session.note ?? '');
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    updateFocusSession(id, {
      taskTitleSnapshot: editTitle,
      durationMinutes: clampMinutes(Number(editMinutesDraft)),
      note: editNote.trim() || undefined,
    });
    setEditingId(null);
  };

  const visibleSessions = sortedSessions.slice(0, visibleLimit);
  const remainingCount = sortedSessions.length - visibleSessions.length;

  return (
    <section className="paper-card rounded-[26px] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">专注历史流水</h3>
            <span className="chip bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
              <span className="tabular-nums">{sortedSessions.length}</span> 条
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            支持手动补录、编辑时长或备注，上方所有图表将实时重算
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="focus-ring btn-primary h-9 rounded-xl px-3.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          补录专注记录
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddSubmit}
          className="animate-fade-up mt-4 space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] p-4"
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              type="text"
              required
              autoFocus
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="专注事项名称（如：线代习题整理）"
              className="field rounded-xl px-3.5 py-2 text-sm"
            />
            <div className="flex items-center">
              <Dropdown
                ariaLabel="关联目标"
                value={addGoalId}
                options={goalOptions}
                onChange={setAddGoalId}
                maxLabelWidth="14rem"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              required
              value={addDate}
              onChange={(e) => {
                if (e.target.value) setAddDate(e.target.value);
              }}
              className="field tabular-nums h-8 rounded-xl px-2.5 text-xs"
            />
            <label className="field inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[var(--text-secondary)]">
              时长
              <input
                type="text"
                inputMode="numeric"
                value={addMinutesDraft}
                onChange={(e) => setAddMinutesDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                onBlur={() => setAddMinutesDraft(String(clampMinutes(Number(addMinutesDraft))))}
                aria-label="补录专注时长（分钟）"
                className="num-display w-10 bg-transparent text-center text-xs font-semibold !tracking-normal text-[var(--text-primary)] outline-none"
              />
              分钟
            </label>
            <input
              type="text"
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="备注（可选）"
              className="field h-8 min-w-[140px] flex-1 rounded-xl px-3 text-xs"
            />
            <div className="ml-auto flex gap-1.5">
              <button type="button" onClick={() => setShowAdd(false)} className="focus-ring btn-soft h-8 px-3 text-xs">
                取消
              </button>
              <button type="submit" className="focus-ring btn-primary h-8 rounded-xl px-3.5 text-xs">
                保存记录
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {sortedSessions.length === 0 ? (
          <EmptyState
            compact
            variant="analytics"
            title="还没有专注历史流水"
            description="完成一次番茄钟会自动写入记录，也可以点击下方手动补录线下学习时长。"
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="focus-ring btn-primary h-9 rounded-xl px-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  补录第一条记录
                </button>
                {!isDemoMode && (
                  <button type="button" onClick={toggleDemoMode} className="focus-ring btn-soft h-9 px-3.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
                    看看演示
                  </button>
                )}
              </>
            }
          />
        ) : (
          <>
            {visibleSessions.map((session) => {
              const isEditing = editingId === session.id;
              if (isEditing) {
                return (
                  <div
                    key={session.id}
                    className="animate-fade-in flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--accent-focus)] bg-[color-mix(in_srgb,var(--accent-focus-soft)_35%,var(--bg-surface))] p-3 text-sm"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      aria-label="编辑事项名称"
                      className="field min-w-[150px] flex-1 rounded-xl px-3 py-1.5 text-sm"
                    />
                    <label className="field inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs text-[var(--text-secondary)]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editMinutesDraft}
                        onChange={(e) => setEditMinutesDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                        onBlur={() => setEditMinutesDraft(String(clampMinutes(Number(editMinutesDraft))))}
                        aria-label="编辑专注分钟数"
                        className="num-display w-10 bg-transparent text-center text-xs font-semibold !tracking-normal text-[var(--text-primary)] outline-none"
                      />
                      分钟
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="备注"
                      aria-label="编辑备注"
                      className="field h-8 w-36 rounded-xl px-2.5 text-xs"
                    />
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => saveEdit(session.id)}
                        aria-label="保存专注记录"
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-break)] text-[var(--on-accent)] transition hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="取消编辑"
                        className="focus-ring icon-btn h-8 w-8"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={session.id}
                  className="task-card group flex min-w-0 items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {session.taskTitleSnapshot}
                      </span>
                      {session.goalTitleSnapshot && (
                        <span className="chip max-w-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: session.goalColorSnapshot ?? '#9C9488' }}
                          />
                          <span className="truncate">{session.goalTitleSnapshot}</span>
                        </span>
                      )}
                    </div>
                    <p className="tabular-nums mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      {session.date} · {formatTimeClock(session.startedAt)}–{formatTimeClock(session.endedAt)}
                      {session.note ? ` · ${session.note}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="num-display rounded-xl bg-[var(--accent-focus-soft)] px-2.5 py-1 text-xs font-semibold !tracking-normal text-[var(--accent-focus)]">
                      {session.durationMinutes} 分钟
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(session)}
                      aria-label="编辑该条专注记录"
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFocusSession(session.id)}
                      aria-label="删除该条专注记录"
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {remainingCount > 0 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 20)}
                  className="focus-ring btn-soft h-9 px-4 text-xs"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  加载更多（还有 {remainingCount} 条）
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
