import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppSettings,
  FocusSession,
  Goal,
  PersistedAppState,
  Priority,
  Task,
  TimeSlot,
} from '../types';
import { addDays, isValidDateKey, toLocalDateKey } from '../utils/date';
import { createEmptyAppState, createSampleAppState } from '../utils/seedData';
import {
  applyDeleteGoal,
  applyDeleteTask,
  loadAppState,
  sanitizeSettings,
  saveAppState,
} from '../utils/storage';
import type { CompletedFocusPayload } from '../utils/timerEngine';

export interface ToastMessage {
  id: string;
  text: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export interface AddTaskInput {
  title: string;
  note?: string;
  date: string;
  timeSlot: TimeSlot;
  priority: Priority;
  goalId?: string;
  estimatedPomodoros: number;
}

export interface AddGoalInput {
  title: string;
  description?: string;
  color: string;
  targetPomodoros: number;
  deadline?: string;
}

export interface ManualSessionInput {
  taskId?: string;
  taskTitleSnapshot: string;
  goalId?: string;
  durationMinutes: number;
  date: string;
  note?: string;
}

interface AppDataContextValue {
  state: PersistedAppState;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  exitDemoMode: () => void;
  toast: ToastMessage | null;
  showToast: (text: string, undoAction?: { label: string; onUndo: () => void }) => void;
  dismissToast: () => void;
  addTask: (input: AddTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  reorderTasks: (date: string, orderedTaskIds: string[], updatedSlotMap?: Record<string, TimeSlot>) => void;
  rolloverUnfinishedTasks: (fromDate: string, toDate?: string) => number;
  addGoal: (input: AddGoalInput) => Goal;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalArchive: (id: string) => void;
  completeBoundFocusSession: (payload: CompletedFocusPayload) => void;
  addManualSession: (input: ManualSessionInput) => void;
  updateFocusSession: (
    id: string,
    patch: Partial<Pick<FocusSession, 'taskTitleSnapshot' | 'durationMinutes' | 'note' | 'date'>>,
  ) => void;
  deleteFocusSession: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceAllData: (nextState: PersistedAppState) => void;
  clearAllData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [realState, setRealState] = useState<PersistedAppState>(() => loadAppState());
  const [demoState, setDemoState] = useState<PersistedAppState | null>(null);

  const isDemoMode = demoState !== null;
  const state = demoState ?? realState;

  const stateRef = useRef<PersistedAppState>(state);
  stateRef.current = state;
  const isDemoRef = useRef<boolean>(isDemoMode);
  isDemoRef.current = isDemoMode;

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Only persist real user data; Demo Mode stays isolated in memory and never overwrites localStorage
  useEffect(() => {
    saveAppState(realState);
  }, [realState]);

  const updateActiveState = useCallback(
    (updater: (prev: PersistedAppState) => PersistedAppState) => {
      if (isDemoRef.current) {
        setDemoState((prev) => (prev ? updater(prev) : prev));
      } else {
        setRealState(updater);
      }
    },
    [],
  );

  // Apply light / dark / system theme to <html> and meta[name="theme-color"]
  useEffect(() => {
    const applyResolvedTheme = () => {
      const resolved =
        state.settings.theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : state.settings.theme;
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#12110F' : '#E6DAC8');
      }
    };

    applyResolvedTheme();
    if (state.settings.theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyResolvedTheme);
    return () => media.removeEventListener('change', applyResolvedTheme);
  }, [state.settings.theme]);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (text: string, undoAction?: { label: string; onUndo: () => void }) => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({
        id: uid('toast'),
        text,
        undoLabel: undoAction?.label,
        onUndo: undoAction?.onUndo,
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 5000);
    },
    [],
  );

  const exitDemoMode = useCallback(() => {
    if (!isDemoRef.current) return;
    setDemoState(null);
    showToast('已退出演示模式，恢复你的个人工作区');
  }, [showToast]);

  const toggleDemoMode = useCallback(() => {
    if (isDemoRef.current) {
      setDemoState(null);
      showToast('已退出演示模式，恢复你的个人工作区');
    } else {
      const sample = createSampleAppState();
      setDemoState({
        ...sample,
        settings: { ...stateRef.current.settings },
      });
      showToast('已进入演示模式（体验修改不会覆盖你的本地数据）');
    }
  }, [showToast]);

  const addTask = useCallback(
    (input: AddTaskInput): Task => {
      const now = Date.now();
      const safeDate = isValidDateKey(input.date) ? input.date : toLocalDateKey(now);
      const sameDayMaxOrder = stateRef.current.tasks
        .filter((t) => t.date === safeDate)
        .reduce((max, t) => Math.max(max, t.order), -1);

      const created: Task = {
        id: uid('task'),
        title: input.title.trim(),
        note: input.note?.trim() || undefined,
        date: safeDate,
        timeSlot: input.timeSlot,
        priority: input.priority,
        goalId: input.goalId || undefined,
        estimatedPomodoros: Math.max(1, Math.min(16, Math.round(input.estimatedPomodoros))),
        completedPomodoros: 0,
        completed: false,
        order: sameDayMaxOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      updateActiveState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, created],
      }));
      return created;
    },
    [updateActiveState],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      updateActiveState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== id) return task;
          const safeDate =
            patch.date !== undefined && isValidDateKey(patch.date) ? patch.date : task.date;
          return {
            ...task,
            ...patch,
            date: safeDate,
            title: patch.title !== undefined ? patch.title.trim() || task.title : task.title,
            estimatedPomodoros:
              patch.estimatedPomodoros !== undefined
                ? Math.max(1, Math.min(16, Math.round(patch.estimatedPomodoros)))
                : task.estimatedPomodoros,
            completedPomodoros:
              patch.completedPomodoros !== undefined
                ? Math.max(0, Math.round(patch.completedPomodoros))
                : task.completedPomodoros,
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [updateActiveState],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const snapshot = stateRef.current.tasks.find((t) => t.id === id);
      if (!snapshot) return;

      updateActiveState((prev) => applyDeleteTask(prev, id));
      showToast(`已删除任务「${snapshot.title}」`, {
        label: '撤销',
        onUndo: () => {
          updateActiveState((prev) => {
            if (prev.tasks.some((t) => t.id === snapshot.id)) return prev;
            return { ...prev, tasks: [...prev.tasks, snapshot] };
          });
          dismissToast();
        },
      });
    },
    [dismissToast, showToast, updateActiveState],
  );

  const toggleTaskComplete = useCallback(
    (id: string) => {
      updateActiveState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed, updatedAt: Date.now() } : task,
        ),
      }));
    },
    [updateActiveState],
  );

  const reorderTasks = useCallback(
    (date: string, orderedTaskIds: string[], updatedSlotMap?: Record<string, TimeSlot>) => {
      const orderIndex = new Map<string, number>();
      orderedTaskIds.forEach((id, idx) => orderIndex.set(id, idx));
      updateActiveState((prev) => {
        let changed = false;
        const nextTasks = prev.tasks.map((task) => {
          if (task.date !== date) return task;
          const nextOrder = orderIndex.get(task.id);
          const nextSlot = updatedSlotMap?.[task.id] ?? task.timeSlot;
          const targetOrder = nextOrder ?? task.order;
          if (targetOrder === task.order && nextSlot === task.timeSlot) return task;
          changed = true;
          return {
            ...task,
            order: targetOrder,
            timeSlot: nextSlot,
            updatedAt: Date.now(),
          };
        });
        return changed ? { ...prev, tasks: nextTasks } : prev;
      });
    },
    [updateActiveState],
  );

  const rolloverUnfinishedTasks = useCallback(
    (fromDate: string, toDate?: string): number => {
      const todayKey = toLocalDateKey();
      const targetDate = toDate ?? (fromDate < todayKey ? todayKey : addDays(fromDate, 1));
      const toMove = stateRef.current.tasks.filter((t) => t.date === fromDate && !t.completed);
      if (toMove.length === 0) return 0;

      const moveIds = new Set(toMove.map((t) => t.id));
      updateActiveState((prev) => {
        let maxOrder = prev.tasks
          .filter((t) => t.date === targetDate)
          .reduce((max, t) => Math.max(max, t.order), -1);

        return {
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (!moveIds.has(task.id)) return task;
            maxOrder += 1;
            return { ...task, date: targetDate, order: maxOrder, updatedAt: Date.now() };
          }),
        };
      });

      showToast(
        `已将 ${toMove.length} 项未完成任务顺延至 ${targetDate === todayKey ? '今天' : targetDate}`,
      );
      return toMove.length;
    },
    [showToast, updateActiveState],
  );

  const addGoal = useCallback(
    (input: AddGoalInput): Goal => {
      const goal: Goal = {
        id: uid('goal'),
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        color: input.color,
        targetPomodoros: Math.max(1, Math.min(999, Math.round(input.targetPomodoros))),
        deadline: input.deadline && isValidDateKey(input.deadline) ? input.deadline : undefined,
        archived: false,
        createdAt: Date.now(),
      };
      updateActiveState((prev) => ({
        ...prev,
        goals: [goal, ...prev.goals],
      }));
      return goal;
    },
    [updateActiveState],
  );

  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
      updateActiveState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                ...patch,
                title: patch.title !== undefined ? patch.title.trim() || g.title : g.title,
                deadline:
                  patch.deadline !== undefined
                    ? patch.deadline && isValidDateKey(patch.deadline)
                      ? patch.deadline
                      : undefined
                    : g.deadline,
                targetPomodoros:
                  patch.targetPomodoros !== undefined
                    ? Math.max(1, Math.min(999, Math.round(patch.targetPomodoros)))
                    : g.targetPomodoros,
              }
            : g,
        ),
      }));
    },
    [updateActiveState],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const target = stateRef.current.goals.find((g) => g.id === id);
      if (!target) return;
      updateActiveState((prev) => applyDeleteGoal(prev, id));
      showToast(`已删除目标「${target.title}」，历史任务与专注记录已保留`);
    },
    [showToast, updateActiveState],
  );

  const toggleGoalArchive = useCallback(
    (id: string) => {
      updateActiveState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, archived: !g.archived } : g)),
      }));
    },
    [updateActiveState],
  );

  const completeBoundFocusSession = useCallback(
    (payload: CompletedFocusPayload) => {
      updateActiveState((prev) => {
        const boundTask = payload.taskId ? prev.tasks.find((t) => t.id === payload.taskId) : undefined;
        const boundGoal = boundTask?.goalId
          ? prev.goals.find((g) => g.id === boundTask.goalId)
          : undefined;

        const session: FocusSession = {
          id: uid('sess'),
          taskId: boundTask?.id,
          taskTitleSnapshot: boundTask?.title ?? '自由专注',
          goalId: boundGoal?.id,
          goalTitleSnapshot: boundGoal?.title,
          goalColorSnapshot: boundGoal?.color,
          phase: 'focus',
          durationMinutes: payload.durationMinutes,
          date: toLocalDateKey(payload.endedAt),
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
        };

        const nextTasks = boundTask
          ? prev.tasks.map((t) =>
              t.id === boundTask.id
                ? { ...t, completedPomodoros: t.completedPomodoros + 1, updatedAt: Date.now() }
                : t,
            )
          : prev.tasks;

        return {
          ...prev,
          tasks: nextTasks,
          sessions: [session, ...prev.sessions],
        };
      });
    },
    [updateActiveState],
  );

  const addManualSession = useCallback(
    (input: ManualSessionInput) => {
      const now = Date.now();
      const safeDate = isValidDateKey(input.date) ? input.date : toLocalDateKey(now);
      const durationMinutes = Math.max(1, Math.min(240, Math.round(input.durationMinutes)));
      updateActiveState((prev) => {
        const goal = input.goalId ? prev.goals.find((g) => g.id === input.goalId) : undefined;
        const session: FocusSession = {
          id: uid('sess'),
          taskId: input.taskId,
          taskTitleSnapshot: input.taskTitleSnapshot.trim() || '手动补录专注',
          goalId: goal?.id,
          goalTitleSnapshot: goal?.title,
          goalColorSnapshot: goal?.color,
          phase: 'focus',
          durationMinutes,
          date: safeDate,
          startedAt: now - durationMinutes * 60_000,
          endedAt: now,
          note: input.note?.trim() || undefined,
        };
        return {
          ...prev,
          sessions: [session, ...prev.sessions],
        };
      });
      showToast(`已补录 ${durationMinutes} 分钟专注记录`);
    },
    [showToast, updateActiveState],
  );

  const updateFocusSession = useCallback(
    (
      id: string,
      patch: Partial<Pick<FocusSession, 'taskTitleSnapshot' | 'durationMinutes' | 'note' | 'date'>>,
    ) => {
      updateActiveState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                date: patch.date && isValidDateKey(patch.date) ? patch.date : s.date,
                taskTitleSnapshot:
                  patch.taskTitleSnapshot !== undefined
                    ? patch.taskTitleSnapshot.trim() || s.taskTitleSnapshot
                    : s.taskTitleSnapshot,
                durationMinutes:
                  patch.durationMinutes !== undefined
                    ? Math.max(1, Math.min(240, Math.round(patch.durationMinutes)))
                    : s.durationMinutes,
              }
            : s,
        ),
      }));
    },
    [updateActiveState],
  );

  const deleteFocusSession = useCallback(
    (id: string) => {
      const deleted = stateRef.current.sessions.find((s) => s.id === id);
      if (!deleted) return;
      updateActiveState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
      }));
      showToast('已删除该条专注记录', {
        label: '撤销',
        onUndo: () => {
          updateActiveState((prev) => {
            if (prev.sessions.some((s) => s.id === deleted.id)) return prev;
            return { ...prev, sessions: [deleted, ...prev.sessions] };
          });
          dismissToast();
        },
      });
    },
    [dismissToast, showToast, updateActiveState],
  );

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setRealState((prev) => ({
      ...prev,
      settings: sanitizeSettings({ ...prev.settings, ...patch }),
    }));
    setDemoState((prev) =>
      prev
        ? {
            ...prev,
            settings: sanitizeSettings({ ...prev.settings, ...patch }),
          }
        : prev,
    );
  }, []);

  const replaceAllData = useCallback(
    (nextState: PersistedAppState) => {
      setDemoState(null);
      setRealState(nextState);
      showToast('备份数据导入成功');
    },
    [showToast],
  );

  const clearAllData = useCallback(() => {
    setDemoState(null);
    setRealState((prev) => createEmptyAppState(prev.settings));
    showToast('已清空全部计划与专注记录');
  }, [showToast]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      isDemoMode,
      toggleDemoMode,
      exitDemoMode,
      toast,
      showToast,
      dismissToast,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      reorderTasks,
      rolloverUnfinishedTasks,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleGoalArchive,
      completeBoundFocusSession,
      addManualSession,
      updateFocusSession,
      deleteFocusSession,
      updateSettings,
      replaceAllData,
      clearAllData,
    }),
    [
      state,
      isDemoMode,
      toggleDemoMode,
      exitDemoMode,
      toast,
      showToast,
      dismissToast,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      reorderTasks,
      rolloverUnfinishedTasks,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleGoalArchive,
      completeBoundFocusSession,
      addManualSession,
      updateFocusSession,
      deleteFocusSession,
      updateSettings,
      replaceAllData,
      clearAllData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
