import { useState, type FormEvent } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useTimer } from '../../context/TimerContext';
import { formatChineseDate, toLocalDateKey } from '../../utils/date';
import { TaskItem } from './TaskItem';

export function SchedulePanel() {
  const { state, addTask, updateTask, deleteTask, toggleTaskComplete, clearSampleData } =
    useAppData();
  const { timerState, bindTask } = useTimer();

  const todayKey = toLocalDateKey();
  const [title, setTitle] = useState('');
  const [estimated, setEstimated] = useState(2);

  const todayTasks = state.tasks
    .filter((t) => t.date === todayKey)
    .sort((a, b) => a.order - b.order);

  const totalEst = todayTasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0);
  const totalDone = todayTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      date: todayKey,
      timeSlot: 'anytime',
      priority: 'medium',
      estimatedPomodoros: estimated,
    });
    setTitle('');
    setEstimated(2);
  };

  return (
    <section aria-label="今日计划安排表" className="paper-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-lg font-semibold">今日计划安排</h2>
          <p className="tabular-nums text-xs text-[var(--text-muted)]">
            {formatChineseDate(todayKey)} · 已完成 {totalDone}/{totalEst} 番茄
          </p>
        </div>

        {state.hasSampleData && (
          <button
            type="button"
            onClick={clearSampleData}
            className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
            清空演示数据
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="写下今天要专注完成的计划，回车添加..."
          className="focus-ring min-w-[200px] flex-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)]"
        />
        <label className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--text-secondary)]">
          🍅
          <input
            type="number"
            min={1}
            max={16}
            value={estimated}
            onChange={(e) => setEstimated(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
            aria-label="预估番茄数"
            className="tabular-nums w-10 bg-transparent py-2 text-center text-sm text-[var(--text-primary)] outline-none"
          />
        </label>
        <button
          type="submit"
          className="focus-ring inline-flex items-center gap-1.5 rounded-2xl bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-focus-hover)]"
        >
          <Plus className="h-4 w-4" />
          添加
        </button>
      </form>

      <div className="mt-5 space-y-2.5">
        {todayTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] py-10 text-center text-sm text-[var(--text-muted)]">
            今日暂无计划，添加第一条任务开始专注吧
          </div>
        ) : (
          todayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={timerState.activeTaskId === task.id}
              onToggleComplete={toggleTaskComplete}
              onBind={(id) => bindTask(id)}
              onUpdate={(id, patch) => updateTask(id, patch)}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </section>
  );
}
