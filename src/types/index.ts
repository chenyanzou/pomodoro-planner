export type Priority = 'high' | 'medium' | 'low';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';
export type AmbientNoiseMode = 'off' | 'rain' | 'pink' | 'brown';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface GoalColorOption {
  id: string;
  label: string;
  hex: string;
}

export const GOAL_COLORS: readonly GoalColorOption[] = [
  { id: 'tomato', label: '番茄红', hex: '#D95338' },
  { id: 'amber', label: '琥珀金', hex: '#C88A2E' },
  { id: 'sage', label: '鼠尾草', hex: '#4D8B6F' },
  { id: 'slate', label: '青黛蓝', hex: '#4A7C9B' },
  { id: 'plum', label: '梅子紫', hex: '#866196' },
  { id: 'clay', label: '暖陶褐', hex: '#8C6B52' },
] as const;

export interface Goal {
  id: string;
  title: string;
  description?: string;
  color: string;
  targetPomodoros: number;
  deadline?: string;
  archived: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  note?: string;
  date: string;
  timeSlot: TimeSlot;
  priority: Priority;
  goalId?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitleSnapshot: string;
  goalId?: string;
  goalTitleSnapshot?: string;
  goalColorSnapshot?: string;
  phase: 'focus';
  durationMinutes: number;
  date: string;
  startedAt: number;
  endedAt: number;
  note?: string;
}

export interface AppSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  ambientNoise: AmbientNoiseMode;
  ambientVolume: number;
  notificationsEnabled: boolean;
  theme: ThemeMode;
}

export interface PersistedTimerState {
  phase: TimerPhase;
  status: 'idle' | 'running' | 'paused';
  remainingSeconds: number;
  endTimestamp: number | null;
  startedAt: number | null;
  totalSeconds: number;
  completedFocusCycles: number;
  activeTaskId: string | null;
}

export interface PersistedAppState {
  schemaVersion: 1;
  hasSampleData: boolean;
  goals: Goal[];
  tasks: Task[];
  sessions: FocusSession[];
  settings: AppSettings;
}
