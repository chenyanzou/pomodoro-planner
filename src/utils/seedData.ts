import type { AppSettings, FocusSession, Goal, PersistedAppState, Task } from '../types';
import { addDays, toLocalDateKey } from './date';

export const DEFAULT_SETTINGS: AppSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.65,
  ambientNoise: 'off',
  ambientVolume: 0.35,
  notificationsEnabled: false,
  theme: 'light',
};

export function createSampleAppState(nowMs = Date.now()): PersistedAppState {
  const today = toLocalDateKey(nowMs);
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const threeDaysAgo = addDays(today, -3);
  const fiveDaysAgo = addDays(today, -5);

  const goals: Goal[] = [
    {
      id: 'goal-sample-study',
      title: '期末核心课程复习',
      description: '系统梳理算法、操作系统与英语高频考点，每日稳步推进',
      color: '#D95338',
      targetPomodoros: 24,
      deadline: addDays(today, 18),
      archived: false,
      createdAt: nowMs - 5 * 86_400_000,
    },
    {
      id: 'goal-sample-project',
      title: 'AI 应用创新赛作品打磨',
      description: '完成番茄计划网页开发、前端性能优化与作品展示文档',
      color: '#4D8B6F',
      targetPomodoros: 16,
      deadline: addDays(today, 10),
      archived: false,
      createdAt: nowMs - 4 * 86_400_000,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-sample-1',
      title: '精读动态规划与贪心典型例题',
      note: '重点整理状态转移方程模板与时间复杂度分析',
      date: today,
      timeSlot: 'morning',
      priority: 'high',
      goalId: 'goal-sample-study',
      estimatedPomodoros: 3,
      completedPomodoros: 1,
      completed: false,
      order: 0,
      createdAt: nowMs - 7_200_000,
      updatedAt: nowMs - 3_600_000,
    },
    {
      id: 'task-sample-2',
      title: '优化番茄计划响应式交互与复盘图表',
      note: '检查移动端底部导航、暗色模式对比度与键盘快捷键',
      date: today,
      timeSlot: 'afternoon',
      priority: 'high',
      goalId: 'goal-sample-project',
      estimatedPomodoros: 2,
      completedPomodoros: 1,
      completed: false,
      order: 1,
      createdAt: nowMs - 5_400_000,
      updatedAt: nowMs - 1_800_000,
    },
    {
      id: 'task-sample-3',
      title: '背诵 40 个高频词汇并做 1 篇精读',
      note: '晚上轻度专注，配合细雨白噪音',
      date: today,
      timeSlot: 'evening',
      priority: 'medium',
      goalId: 'goal-sample-study',
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      completed: false,
      order: 2,
      createdAt: nowMs - 3_600_000,
      updatedAt: nowMs - 1_800_000,
    },
  ];

  const makeSession = (
    id: string,
    date: string,
    offsetHoursAgo: number,
    durationMinutes: number,
    taskTitleSnapshot: string,
    goal?: Goal,
    taskId?: string,
  ): FocusSession => {
    const endedAt = nowMs - offsetHoursAgo * 3_600_000;
    return {
      id,
      taskId,
      taskTitleSnapshot,
      goalId: goal?.id,
      goalTitleSnapshot: goal?.title,
      goalColorSnapshot: goal?.color,
      phase: 'focus',
      durationMinutes,
      date,
      startedAt: endedAt - durationMinutes * 60_000,
      endedAt,
    };
  };

  const sessions: FocusSession[] = [
    makeSession('sess-sample-1', today, 2, 25, '精读动态规划与贪心典型例题', goals[0], 'task-sample-1'),
    makeSession('sess-sample-2', today, 1, 25, '优化番茄计划响应式交互与复盘图表', goals[1], 'task-sample-2'),
    makeSession('sess-sample-3', yesterday, 26, 25, '梳理操作系统进程调度笔记', goals[0]),
    makeSession('sess-sample-4', yesterday, 25, 25, '设计暖纸极简双主题色板', goals[1]),
    makeSession('sess-sample-5', twoDaysAgo, 50, 25, '完成数据结构树与图专题练习', goals[0]),
    makeSession('sess-sample-6', threeDaysAgo, 74, 25, '编写番茄钟核心引擎单元测试', goals[1]),
    makeSession('sess-sample-7', fiveDaysAgo, 122, 25, '整理一周学习目标清单', undefined),
  ];

  return {
    schemaVersion: 1,
    hasSampleData: true,
    goals,
    tasks,
    sessions,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function createEmptyAppState(settings: AppSettings = DEFAULT_SETTINGS): PersistedAppState {
  return {
    schemaVersion: 1,
    hasSampleData: false,
    goals: [],
    tasks: [],
    sessions: [],
    settings: { ...settings },
  };
}
