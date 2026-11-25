import { useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import type { FocusSession } from '../../types';
import { formatTimeClock, toLocalDateKey } from '../../utils/date';

export function SessionHistory() {
  const { state, addManualSession, updateFocusSession, deleteFocusSession } = useAppData();

  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addGoalId, setAddGoalId] = useState('');
  const [addDate, setAddDate] = useState(() => toLocalDateKey());
  const [addMinutes, setAddMinutes] = useState(25);
  const [addNote, setAddNote] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMinutes, setEditMinutes] = useState(25);
  const [editNote, setEditNote] = useState('');

  const sortedSessions = [...state.sessions].sort((a, b) => b.endedAt - a.endedAt);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) return;
    addManualSession({
      taskTitleSnapshot: addTitle,
      goalId: addGoalId || undefined,
      durationMinutes: addMinutes,
      date: addDate,
      note: addNote,
    });
    setAddTitle('');
    setAddNote('');
    setAddMinutes(25);
    setShowAdd(false);
  };

  const startEdit = (session: FocusSession) => {
    setEditingId(session.id);
    setEditTitle(session.taskTitleSnapshot);
    setEditMinutes(session.durationMinutes);
    setEditNote(session.note ?? '');
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    updateFocusSession(id, {
      taskTitleSnapshot: editTitle,
      durationMinutes: editMinutes,
      note: editNote.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <section className="paper-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-base font-semibold">专注历史流水</h3>
          <p className="text-xs text-[var(--text-muted)]">
            支持手动补录、编辑时长/备注或删除，上方所有图表将实时重算
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-focus-hover)]"
        >
          <Plus className="h-3.5 w-3.5" />
          补录专注记录
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddSubmit}
          className="mt-4 space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4"
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              type="text"
              required
              autoFocus
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="专注事项名称（如：线代习题整理）"
              className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            />
            <select
              value={addGoalId}
              onChange={(e) => setAddGoalId(e.target.value)}
              className="focus-ring rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)]"
            >
              <option value="">不关联目标（日常零散专注）</option>
              {state.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <input
              type="date"
              required
              value={addDate}
              onChange={(e) => {
                if (e.target.value) setAddDate(e.target.value);
              }}
              className="tabular-nums rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5"
            />
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text-secondary)]">
              时长
              <input
                type="number"
                min={1}
                max={240}
                value={addMinutes}
                onChange={(e) => setAddMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
                className="tabular-nums w-12 bg-transparent text-center font-medium text-[var(--text-primary)] outline-none"
              />
              分钟
            </label>
            <input
              type="text"
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="备注（可选）"
              className="focus-ring min-w-[160px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5"
            />
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[var(--accent-focus)] px-3.5 py-1.5 font-medium text-white hover:opacity-90"
              >
                保存记录
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {sortedSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] py-10 text-center text-sm text-[var(--text-muted)]">
            还没有专注流水记录
          </div>
        ) : (
          sortedSessions.slice(0, 40).map((session) => {
            const isEditing = editingId === session.id;
            if (isEditing) {
              return (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--accent-focus)] bg-[var(--bg-canvas)] p-3 text-sm"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="focus-ring min-w-[160px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm"
                  />
                  <label className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={editMinutes}
                      onChange={(e) =>
                        setEditMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))
                      }
                      className="tabular-nums w-14 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-center text-sm"
                    />
                    分钟
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="备注"
                    className="focus-ring w-40 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                  <div className="ml-auto flex gap-1">
                    <button
                      type="button"
                      onClick={() => saveEdit(session.id)}
                      aria-label="保存专注记录"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-break)] text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="取消编辑"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
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
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3.5 py-2.5 transition hover:border-[var(--border-strong)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{session.taskTitleSnapshot}</span>
                    {session.goalTitleSnapshot && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: session.goalColorSnapshot ?? '#9C9488' }}
                        />
                        {session.goalTitleSnapshot}
                      </span>
                    )}
                  </div>
                  <p className="tabular-nums mt-0.5 text-xs text-[var(--text-muted)]">
                    {session.date} · {formatTimeClock(session.startedAt)}–{formatTimeClock(session.endedAt)}
                    {session.note ? ` · ${session.note}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="tabular-nums rounded-xl bg-[var(--accent-focus-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]">
                    {session.durationMinutes} 分钟
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(session)}
                    aria-label="编辑该条专注记录"
                    className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFocusSession(session.id)}
                    aria-label="删除该条专注记录"
                    className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--accent-focus-soft)] hover:text-[var(--accent-focus)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
