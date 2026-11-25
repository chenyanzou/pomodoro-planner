# 番茄计划（Pomodoro Planner）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy **番茄计划（Pomodoro Planner）**, a local-first static Pomodoro timer + daily schedule + goal breakdown + analytics web app on GitHub Pages across three authentic Git milestones (`v0.1` → `v0.3` → `v1.0`), and package all competition deliverables into `e:\网站项目\pomodoro-planner-比赛提交包.zip`.

**Architecture:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 SPA located in a clean standalone Git repository `e:\网站项目\pomodoro-planner\`. High-frequency timer state (`TimerContext` backed by `pomodoro_planner_timer_v1` + `endTimestamp`) is strictly isolated from low-frequency domain data (`AppDataContext` backed by `pomodoro_planner_state_v1`) to eliminate 1-second list re-renders; analytics charts are custom lightweight SVGs loaded via `React.lazy`; audio chimes and ambient noise are synthesized purely with Web Audio API.

**Tech Stack:** React 19, TypeScript 5, Vite 6, Tailwind CSS v4, `lucide-react`, `vite-plugin-pwa`, Vitest, GitHub Actions (`actions/deploy-pages`).

**Spec:** `e:\网站项目\docs\superpowers\specs\2026-11-24-pomodoro-planner-design.md`

---

## Global Constraints

- Public Git repository root MUST be `e:\网站项目\pomodoro-planner\`; competition snapshots & ZIP live outside at `e:\网站项目\submission\` and `e:\网站项目\pomodoro-planner-比赛提交包.zip`.
- Static-only deployment on GitHub Pages: `base` in `vite.config.ts` MUST default to `process.env.VITE_BASE_PATH || '/pomodoro-planner/'`; zero backend, zero login, zero external font/audio CDN dependencies.
- Pure lightweight frontend: NO heavy chart or UI libraries (no ECharts, Chart.js, Recharts, AntD, MUI); Analytics view MUST be code-split via `React.lazy`.
- Single Source of Truth contract: `FocusSession[]` drives all time/chart analytics and today's focus minutes; `Task.completedPomodoros` is the task-level counter incremented atomically alongside a new `FocusSession` on natural timer completion; manual edits to `Task.completedPomodoros` do NOT fabricate sessions, and deleting/editing `FocusSession` does NOT mutate tasks.
- Visual aesthetic: Warm Paper Swiss Minimalism (`#F8F6F1` light / `#171614` dark, `#D95338` focus terracotta / `#4D8B6F` break sage, `tabular-nums` on all numeric counters), Simplified Chinese UI copy, full desktop + mobile responsive layout.
- Authentic 3-stage Git history: commit and tag `v0.1`, `v0.3`, and `v1.0` after each stage passes `tsc --noEmit`, `vitest run` (from v0.3+), and `vite build`, exporting clean snapshots (excluding `node_modules`/`.git`/`dist`) after each tag.

## Review Focus

1. **Offline / background tab timer completion recovery:** Closing or backgrounding the tab past `endTimestamp` must accurately complete a `focus` phase on return, log the `FocusSession`, increment the bound task's `completedPomodoros`, advance `completedFocusCycles` (triggering `longBreak` on the `longBreakInterval`-th cycle), and avoid double-logging if hydrated twice. *(Pinned in Task 2)*
2. **Corrupted or partial `localStorage` recovery:** Malformed JSON or missing keys in `pomodoro_planner_state_v1` / `pomodoro_planner_timer_v1` must gracefully fall back to safe defaults without crashing the app on boot. *(Pinned in Task 3)*
3. **Malformed JSON backup import safety:** Importing invalid JSON, wrong `schemaVersion`, negative durations, or broken dates must return a clear Chinese error message and leave existing state completely untouched. *(Pinned in Task 7)*
4. **Cross-month / cross-year streak & local timezone date boundaries:** Local `YYYY-MM-DD` formatting must never drift by 1 day due to `toISOString()` UTC conversion, and consecutive focus day streaks must count accurately across month/year boundaries and update live when sessions are deleted/backfilled. *(Pinned in Task 2 & Task 7)*
5. **Active task deletion while timer is running + goal deletion snapshot preservation:** Deleting the currently bound `activeTaskId` must cleanly unbind the timer without resetting or stopping the countdown; deleting a goal must keep historical `FocusSession` snapshots intact and clear `task.goalId` without deleting tasks. *(Pinned in Task 3)*

---

## File Structure Map (`e:\网站项目\pomodoro-planner\`)

```text
pomodoro-planner/
├── .github/workflows/deploy.yml       # GitHub Pages auto-build & deploy (Task 10)
├── public/
│   └── favicon.svg                    # Custom warm-paper tomato SVG icon (Task 10)
├── index.html                         # Entry HTML with theme anti-flash script (Task 1 & 10)
├── package.json                       # Scripts: dev, build, test, typecheck (Task 1)
├── tsconfig.json                      # Strict TS config (Task 1)
├── vite.config.ts                     # Configurable base + Tailwind + PWA (Task 1 & 10)
├── vitest.config.ts                   # Vitest node/jsdom test setup (Task 1)
├── src/
│   ├── main.tsx                       # Entry mount (Task 1)
│   ├── index.css                      # Warm paper light/dark CSS tokens + tabular-nums + animations (Task 1 & 10)
│   ├── types/index.ts                 # All domain interfaces & storage schema types (Task 2)
│   ├── utils/
│   │   ├── date.ts                    # Local-timezone YYYY-MM-DD, date arithmetic, Chinese labels (Task 2)
│   │   ├── timerEngine.ts             # Pure drift-free timer state transitions & offline completion (Task 2)
│   │   ├── storage.ts                 # Safe localStorage load/save for state & timer keys (Task 3)
│   │   ├── seedData.ts                # First-visit Chinese sample goals/tasks/sessions (Task 3)
│   │   ├── analytics.ts               # KPI, 7/30d trend, goal donut, 12w heatmap, streak aggregators (Task 7)
│   │   ├── backup.ts                  # Schema v1 JSON export & strict runtime import validator (Task 7)
│   │   └── audioEngine.ts             # Pure Web Audio chime & rain/pink/brown noise synthesizer (Task 9)
│   ├── context/
│   │   ├── AppDataContext.tsx         # Low-frequency store: goals, tasks, sessions, settings, undo toast (Task 3)
│   │   └── TimerContext.tsx           # High-frequency timer loop, tab title, notifications, audio hooks (Task 3 & 9)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx             # Top bar: brand, 3 tabs, theme/shortcuts/settings (Task 4 & 10)
│   │   │   ├── MobileNav.tsx          # Mobile fixed bottom 3-tab nav (Task 10)
│   │   │   └── UndoToast.tsx          # Lightweight toast with 5s undo action (Task 5)
│   │   ├── timer/
│   │   │   ├── TimerCard.tsx          # SVG ring countdown, phase pills, cycle dots, ambient control (Task 4 & 9)
│   │   │   └── ImmersiveOverlay.tsx   # Fullscreen minimal focus mode (Task 9)
│   │   ├── schedule/
│   │   │   ├── SchedulePanel.tsx      # Date nav, today progress, quick add, filters, rollover (Task 4 & 5)
│   │   │   ├── TaskItem.tsx           # Task row with drag handle, fallback reorder, bind/edit/delete (Task 4 & 5)
│   │   │   └── TaskModal.tsx          # Full task create/edit modal (Task 5)
│   │   ├── goals/
│   │   │   ├── GoalsView.tsx          # Goal cards grid, progress bars, 1-click spawn task (Task 6)
│   │   │   └── GoalModal.tsx          # Goal create/edit modal with 6-color warm palette (Task 6)
│   │   ├── analytics/
│   │   │   ├── AnalyticsView.tsx      # Lazy-loaded container: KPIs + charts + history (Task 8)
│   │   │   ├── TrendBarChart.tsx      # Custom responsive SVG 7/30-day bar chart with tooltip (Task 8)
│   │   │   ├── GoalDonutChart.tsx     # Custom SVG donut chart + legend (Task 8)
│   │   │   ├── ActivityHeatmap.tsx    # 12-week warm-terracotta SVG/CSS grid heatmap (Task 8)
│   │   │   └── SessionHistory.tsx     # Focus log list + manual backfill/edit/delete modal (Task 8)
│   │   └── modals/
│   │       ├── SettingsModal.tsx      # Timer durations, auto-start, audio, theme, JSON backup (Task 9)
│   │       └── ShortcutsModal.tsx     # Keyboard shortcuts cheat sheet (Task 9)
│   └── App.tsx                        # Root shell, lazy analytics boundary, global hotkeys (Task 4, 8, 9, 10)
└── tests/
    ├── date.test.ts                   # Task 2
    ├── timerEngine.test.ts            # Task 2
    ├── storage.test.ts                # Task 3
    ├── analytics.test.ts              # Task 7
    └── backup.test.ts                 # Task 7
```

---

## Milestone `v0.1` — 最小可用原型（MVP）

### Task 1: Project Scaffolding & Warm Paper Base Tokens

**Files:**
- Create: `e:\网站项目\pomodoro-planner\package.json`
- Create: `e:\网站项目\pomodoro-planner\tsconfig.json`
- Create: `e:\网站项目\pomodoro-planner\vite.config.ts`
- Create: `e:\网站项目\pomodoro-planner\vitest.config.ts`
- Create: `e:\网站项目\pomodoro-planner\index.html`
- Create: `e:\网站项目\pomodoro-planner\src\main.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\index.css`
- Create: `e:\网站项目\pomodoro-planner\.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `typecheck`, `test`; CSS custom properties `--bg-canvas`, `--bg-surface`, `--bg-subtle`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-focus`, `--accent-focus-soft`, `--accent-break`, `--accent-break-soft`.

- [ ] **Step 1: Initialize `e:\网站项目\pomodoro-planner\` and install dependencies**
  Create directory `e:\网站项目\pomodoro-planner\`, run `git init -b main`, create `package.json` with `react`, `react-dom`, `lucide-react`, and devDependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `vite-plugin-pwa`. Run `npm install`.
- [ ] **Step 2: Configure `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`**
  Set `base: process.env.VITE_BASE_PATH || '/pomodoro-planner/'` in `vite.config.ts`, enable `@vitejs/plugin-react` and `@tailwindcss/vite`. Set `strict: true`, `noUnusedLocals: true` in `tsconfig.json`. Configure Vitest environment `node` in `vitest.config.ts`.
- [ ] **Step 3: Create `index.html`, `src/index.css`, `src/main.tsx`**
  Include warm paper light & warm charcoal dark CSS variables under `:root` and `[data-theme="dark"]`, system Chinese font stack, `.tabular-nums`, smooth reduced-motion media query, and inline `<script>` in `index.html` reading persisted theme before paint to prevent dark-mode flash.
- [ ] **Step 4: Verify toolchain builds cleanly**
  Run: `npm run typecheck && npm run build` inside `e:\网站项目\pomodoro-planner\`
  Expected: Exit 0, `dist/index.html` generated with `/pomodoro-planner/` asset paths.
- [ ] **Step 5: Commit scaffold**
  `git add . && git commit -m "chore: scaffold React + Vite + Tailwind project for pomodoro-planner"`

---

### Task 2: Domain Types, Local Date Utilities & Pure Drift-Free Timer Engine

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\types\index.ts`
- Create: `e:\网站项目\pomodoro-planner\src\utils\date.ts`
- Create: `e:\网站项目\pomodoro-planner\src\utils\timerEngine.ts`
- Test: `e:\网站项目\pomodoro-planner\tests\date.test.ts`
- Test: `e:\网站项目\pomodoro-planner\tests\timerEngine.test.ts`

**Interfaces:**
- Produces in `src/types/index.ts`: `Priority`, `TimeSlot`, `TimerPhase`, `Goal`, `Task`, `FocusSession`, `AppSettings`, `PersistedTimerState`, `PersistedAppState`, `GOAL_COLORS`.
- Produces in `src/utils/date.ts`: `toLocalDateKey(date?: Date | number): string`, `addDays(dateKey: string, delta: number): string`, `formatChineseDate(dateKey: string): string`, `isValidDateKey(value: string): boolean`, `diffDays(fromKey: string, toKey: string): number`.
- Produces in `src/utils/timerEngine.ts`: `getPhaseDurationSeconds(phase: TimerPhase, settings: AppSettings): number`, `createInitialTimerState(settings: AppSettings): PersistedTimerState`, `startTimer(state: PersistedTimerState, now: number): PersistedTimerState`, `pauseTimer(state: PersistedTimerState, now: number): PersistedTimerState`, `resetTimer(state: PersistedTimerState, settings: AppSettings): PersistedTimerState`, `switchTimerPhase(state: PersistedTimerState, phase: TimerPhase, settings: AppSettings): PersistedTimerState`, `getRemainingSeconds(state: PersistedTimerState, now: number): number`, `reconcileTimerAt(state: PersistedTimerState, settings: AppSettings, now: number): { nextState: PersistedTimerState; completedFocus: { startedAt: number; endedAt: number; durationMinutes: number; taskId: string | null } | null; phaseEnded: TimerPhase | null }`.

- [ ] **Step 1: Create `src/types/index.ts`**
  Define all interfaces matching Spec Section 3.2 verbatim, plus `PersistedAppState { schemaVersion: 1; hasSampleData: boolean; goals: Goal[]; tasks: Task[]; sessions: FocusSession[]; settings: AppSettings; }` and `GOAL_COLORS` (the 6 warm paper colors from Spec 4.1).
- [ ] **Step 2: Write failing tests in `tests/date.test.ts` and `tests/timerEngine.test.ts`**
  Assert:
  - `toLocalDateKey(new Date(2026, 10, 24, 0, 5, 0))` returns `'2026-11-24'` (Review Focus #4: local timezone never drifts across midnight).
  - `addDays('2026-12-31', 1)` returns `'2027-01-01'` and `addDays('2026-03-01', -1)` returns `'2026-02-28'`.
  - `reconcileTimerAt` when `now >= endTimestamp` during `focus`: returns `completedFocus` with exact `durationMinutes`, increments `completedFocusCycles`, transitions to `shortBreak` for cycles 1..3 and `longBreak` on cycle `longBreakInterval` (4), and calling `reconcileTimerAt` a second time on `nextState` returns `completedFocus: null` (Review Focus #1: no double logging!).
  - `pauseTimer` preserves exact remaining seconds based on `endTimestamp - now`.
- [ ] **Step 3: Run tests to verify they fail**
  Run: `npx vitest run tests/date.test.ts tests/timerEngine.test.ts`
  Expected: FAIL (modules not found).
- [ ] **Step 4: Implement `src/utils/date.ts` and `src/utils/timerEngine.ts`**
  Implement pure functions using local `Date` getters (`getFullYear`, `getMonth`, `getDate`) and `endTimestamp` arithmetic.
- [ ] **Step 5: Run tests to verify pass and commit**
  Run: `npx vitest run tests/date.test.ts tests/timerEngine.test.ts`
  Expected: PASS (all assertions green).
  Commit: `git add src/types src/utils/date.ts src/utils/timerEngine.ts tests/ && git commit -m "feat: add core domain types, local date helpers, and drift-free timer engine"`

---

### Task 3: Storage Persistence, Sample Seed Data & Split State Contexts

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\utils\storage.ts`
- Create: `e:\网站项目\pomodoro-planner\src\utils\seedData.ts`
- Create: `e:\网站项目\pomodoro-planner\src\context\AppDataContext.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\context\TimerContext.tsx`
- Test: `e:\网站项目\pomodoro-planner\tests\storage.test.ts`

**Interfaces:**
- Consumes: `src/types/index.ts`, `src/utils/date.ts`, `src/utils/timerEngine.ts`.
- Produces in `src/utils/storage.ts`: `STATE_STORAGE_KEY = 'pomodoro_planner_state_v1'`, `TIMER_STORAGE_KEY = 'pomodoro_planner_timer_v1'`, `DEFAULT_SETTINGS: AppSettings`, `loadAppState(storage?: Pick<Storage, 'getItem'>): PersistedAppState`, `saveAppState(state: PersistedAppState, storage?: Pick<Storage, 'setItem'>): void`, `loadTimerState(settings: AppSettings, storage?: Pick<Storage, 'getItem'>): PersistedTimerState`, `saveTimerState(state: PersistedTimerState, storage?: Pick<Storage, 'setItem'>): void`, `applyDeleteTask(state: PersistedAppState, taskId: string): PersistedAppState`, `applyDeleteGoal(state: PersistedAppState, goalId: string): PersistedAppState`.
- Produces in `AppDataContext.tsx`: `useAppData()` exposing `state`, `toast`, `dismissToast`, `addTask`, `updateTask`, `deleteTask` (with 5s undo), `toggleTaskComplete`, `reorderTasks`, `rolloverUnfinishedTasks`, `addGoal`, `updateGoal`, `deleteGoal`, `toggleGoalArchive`, `logFocusSession`, `updateFocusSession`, `deleteFocusSession`, `updateSettings`, `replaceAllData`, `clearSampleData`, `resetToSampleData`, `clearAllData`.
- Produces in `TimerContext.tsx`: `useTimer()` exposing `timerState`, `remainingSeconds`, `progress` (0..1), `start`, `pause`, `toggle`, `reset`, `skipPhase`, `switchPhase`, `bindTask`.

- [ ] **Step 1: Write failing tests in `tests/storage.test.ts`**
  Assert:
  - `loadAppState` with corrupted JSON `"{bad json"` falls back cleanly to seeded default state without throwing (Review Focus #2).
  - `loadTimerState` with missing/invalid fields falls back cleanly to `createInitialTimerState(DEFAULT_SETTINGS)` (Review Focus #2).
  - `applyDeleteGoal` keeps existing `FocusSession` snapshots untouched and clears `goalId` on linked tasks without deleting those tasks (Review Focus #5).
  - `applyDeleteTask` removes the task while keeping historical `FocusSession` snapshots untouched (Review Focus #5).
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/storage.test.ts`
  Expected: FAIL.
- [ ] **Step 3: Implement `src/utils/seedData.ts` and `src/utils/storage.ts`**
  Seed data creates 2 sample Chinese goals, 3 realistic today tasks across morning/afternoon/evening, and 5 recent focus sessions over the past 5 days so judges immediately see live charts, plus `hasSampleData: true`.
- [ ] **Step 4: Run `tests/storage.test.ts` to verify pass**
  Run: `npx vitest run tests/storage.test.ts`
  Expected: PASS.
- [ ] **Step 5: Implement `src/context/AppDataContext.tsx` and `src/context/TimerContext.tsx`**
  - Keep `TimerContext` on a `250ms` interval + `visibilitychange` listener calling `reconcileTimerAt`.
  - When `reconcileTimerAt` emits `completedFocus`, atomically call `logFocusSession` + increment bound task's `completedPomodoros` if bound task still exists.
  - When `activeTaskId` disappears from `state.tasks`, unbind `activeTaskId = null` without interrupting the running countdown (Review Focus #5).
- [ ] **Step 6: Typecheck & commit**
  Run: `npm run typecheck && npx vitest run`
  Expected: PASS.
  Commit: `git add src/utils/seedData.ts src/utils/storage.ts src/context/ tests/storage.test.ts && git commit -m "feat: add versioned storage, sample seed data, and split app/timer contexts"`

---

### Task 4: `v0.1` MVP UI, Build Verification, Tag `v0.1` & Snapshot Export

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\components\layout\Header.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\timer\TimerCard.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\schedule\TaskItem.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\schedule\SchedulePanel.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Consumes: `useAppData()`, `useTimer()`.
- Produces: Working `v0.1` MVP with desktop 2-column layout (TimerCard on left, today's task CRUD list on right), theme toggle, and sample-data banner.

- [ ] **Step 1: Build `Header.tsx`, `TimerCard.tsx`, `TaskItem.tsx`, `SchedulePanel.tsx`, and `App.tsx`**
  - `TimerCard`: phase switcher (`专注` / `短休` / `长休`), smooth SVG circular progress ring, large `tabular-nums` MM:SS countdown, active bound task pill, start/pause + reset + skip buttons, cycle progress dots.
  - `SchedulePanel` (`v0.1` MVP): quick-add input for today's tasks, toggle complete, inline/quick edit title & estimated pomodoros, delete, and "绑定番茄钟" action.
- [ ] **Step 2: Verify typecheck, tests, and production build**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Expected: All pass cleanly with zero warnings/errors.
- [ ] **Step 3: Commit `v0.1`, tag `v0.1`, and export clean snapshot**
  Commit: `git add . && git commit -m "feat(v0.1): release MVP pomodoro timer and basic today task list"`
  Tag: `git tag -a v0.1 -m "v0.1 MVP: drift-free Pomodoro timer + basic today schedule + localStorage"`
  Export clean working tree snapshot (excluding `node_modules`, `.git`, `dist`) to `e:\网站项目\submission\05_迭代版本快照\v0.1\`.

---

## Milestone `v0.3` — 完整计划排程、目标拆解、拖拽与复盘统计

### Task 5: Full Daily Schedule (Date Nav, Time Slots, Priority, Drag & Drop, Edit Modal, Rollover, Undo Toast)

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\components\layout\UndoToast.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\schedule\TaskModal.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\components\schedule\SchedulePanel.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\components\schedule\TaskItem.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Consumes: `useAppData()` (`updateTask`, `deleteTask`, `reorderTasks`, `rolloverUnfinishedTasks`, `toast`), `useTimer()` (`bindTask`, `timerState.activeTaskId`).
- Produces: Full CRUD modal, 5s undoable delete toast, date switching (`<` / Today / `>` + date input), 4 time-slot groups (`上午` / `下午` / `晚上` / `自由时段`), drag-and-drop within & across slots + up/down button fallback, status & goal filter pills, unfinished rollover action.

- [ ] **Step 1: Implement `UndoToast.tsx` and `TaskModal.tsx`**
  `TaskModal` allows editing title, note, date (`YYYY-MM-DD`), timeSlot, priority (`high`/`medium`/`low`), goalId, `estimatedPomodoros` (1..16), and `completedPomodoros` (>= 0) with clear helper copy noting manual edits don't alter focus history logs.
- [ ] **Step 2: Upgrade `TaskItem.tsx` and `SchedulePanel.tsx`**
  - Add date switcher + today summary progress bar (showing both task pomodoro ratio and `FocusSession`-sourced today focus minutes per Single Source of Truth contract).
  - Group tasks into `上午` / `下午` / `晚上` / `自由时段`, support HTML5 drag-and-drop reorder & cross-slot drop highlight, plus keyboard/touch-friendly move up/down buttons.
  - Add status filter (`全部` / `待办` / `已完成`), goal filter dropdown, and "顺延未完成" button (moves past unfinished tasks to today, or today's unfinished tasks to tomorrow).
- [ ] **Step 3: Wire `UndoToast` in `App.tsx`, verify & commit**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Expected: PASS.
  Commit: `git add src/ && git commit -m "feat(schedule): add date navigation, time slots, drag-and-drop, edit modal, rollover, and undo toast"`

---

### Task 6: Goal Breakdown View (`目标拆解`)

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\components\goals\GoalModal.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\goals\GoalsView.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\components\layout\Header.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Consumes: `useAppData()` (`goals`, `tasks`, `sessions`, `addGoal`, `updateGoal`, `deleteGoal`, `toggleGoalArchive`, `addTask`).
- Produces: Interactive Goal cards with progress bars (`sum(linkedTasks.completedPomodoros) / targetPomodoros`), logged focus minutes badge (`sum(matchingSessions.durationMinutes)`), deadline countdown, active/archived filter, and "+ 拆解为今日任务" inline quick-spawn form.

- [ ] **Step 1: Create `GoalModal.tsx` and `GoalsView.tsx`**
  Include the 6 warm-paper goal color swatches (`GOAL_COLORS`), target pomodoro input, optional deadline, archive toggle, delete confirmation, and quick "拆解为指定日期任务" action that creates a linked task and optionally switches to the Schedule tab.
- [ ] **Step 2: Wire `目标拆解` tab in `Header.tsx` and `App.tsx`**
  Ensure active view state switches cleanly between `'focus'` and `'goals'` (and prepares `'analytics'` for Task 8).
- [ ] **Step 3: Verify & commit**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Expected: PASS.
  Commit: `git add src/ && git commit -m "feat(goals): add goal breakdown view with progress rollup and quick task spawning"`

---

### Task 7: Analytics Aggregators & Strict JSON Backup Engine (TDD)

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\utils\analytics.ts`
- Create: `e:\网站项目\pomodoro-planner\src\utils\backup.ts`
- Test: `e:\网站项目\pomodoro-planner\tests\analytics.test.ts`
- Test: `e:\网站项目\pomodoro-planner\tests\backup.test.ts`

**Interfaces:**
- Consumes: `src/types/index.ts`, `src/utils/date.ts`.
- Produces in `src/utils/analytics.ts`:
  - `computeKpiSummary(sessions: FocusSession[], todayKey: string): { todayPomodoros: number; todayMinutes: number; weekMinutes: number; weekPomodoros: number; monthMinutes: number; monthPomodoros: number; streakDays: number }`
  - `computeDailyTrend(sessions: FocusSession[], todayKey: string, days: 7 | 30): Array<{ date: string; label: string; minutes: number; count: number }>`
  - `computeGoalDistribution(sessions: FocusSession[], goals: Goal[]): Array<{ key: string; title: string; color: string; minutes: number; percentage: number }>`
  - `computeHeatmapWeeks(sessions: FocusSession[], todayKey: string, weeks?: number): Array<Array<{ date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4 }>>`
- Produces in `src/utils/backup.ts`:
  - `createBackupPayload(state: PersistedAppState): string`
  - `parseAndValidateBackup(rawJson: string): { ok: true; state: PersistedAppState; summary: { goals: number; tasks: number; sessions: number } } | { ok: false; error: string }`

- [ ] **Step 1: Write failing tests in `tests/analytics.test.ts` and `tests/backup.test.ts`**
  Assert:
  - `computeKpiSummary` calculates cross-year streak (`2026-12-30`, `2026-12-31`, `2027-01-01` → `streakDays: 3`), handles gap breaking streak, and reflects deleted/backfilled sessions immediately (Review Focus #4).
  - `computeDailyTrend(..., 7)` returns exactly 7 chronologically ordered buckets ending on `todayKey`.
  - `computeGoalDistribution` groups unlinked sessions under `'日常零散专注'` and preserves `goalTitleSnapshot` for deleted goals.
  - `parseAndValidateBackup` rejects invalid JSON, wrong `schemaVersion: 2`, negative `durationMinutes`, and invalid date `'2026-13-45'` with Chinese error strings, while accepting a round-tripped `createBackupPayload` output (Review Focus #3).
- [ ] **Step 2: Run tests to verify failure**
  Run: `npx vitest run tests/analytics.test.ts tests/backup.test.ts`
  Expected: FAIL.
- [ ] **Step 3: Implement `src/utils/analytics.ts` and `src/utils/backup.ts`**
- [ ] **Step 4: Run tests to verify pass & commit**
  Run: `npx vitest run tests/analytics.test.ts tests/backup.test.ts`
  Expected: PASS.
  Commit: `git add src/utils/analytics.ts src/utils/backup.ts tests/analytics.test.ts tests/backup.test.ts && git commit -m "feat(analytics,backup): add pure statistics aggregators and validated JSON backup engine"`

---

### Task 8: Lazy-Loaded Analytics Dashboard (`复盘统计`), Tag `v0.3` & Snapshot Export

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\components\analytics\TrendBarChart.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\analytics\GoalDonutChart.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\analytics\ActivityHeatmap.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\analytics\SessionHistory.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\analytics\AnalyticsView.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Consumes: `useAppData()`, `src/utils/analytics.ts`.
- Produces: Default-exported `AnalyticsView` loaded via `React.lazy(() => import('./components/analytics/AnalyticsView'))` inside `<Suspense>` so the initial bundle excludes analytics chart code.

- [ ] **Step 1: Build custom SVG `TrendBarChart.tsx`, `GoalDonutChart.tsx`, `ActivityHeatmap.tsx`**
  - `TrendBarChart`: toggle between `近 7 天` and `近 30 天`, hover/focus interactive tooltip with date + minutes + count.
  - `GoalDonutChart`: SVG `stroke-dasharray` donut ring + accessible legend + empty state.
  - `ActivityHeatmap`: 12-week grid with 5 warm-terracotta intensity levels + hover tooltip + mobile horizontal scroll wrapper.
- [ ] **Step 2: Build `SessionHistory.tsx` and `AnalyticsView.tsx`**
  - 4 top KPI cards (`今日专注`, `本周累计`, `本月累计`, `连续专注`).
  - History log sorted newest-first with "+ 手动补录专注", inline/modal edit (`durationMinutes`, `note`, `taskTitleSnapshot`), and delete (all charts recalculate immediately).
- [ ] **Step 3: Wire lazy-loaded `AnalyticsView` in `App.tsx` and verify code-splitting**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Expected: PASS, and `vite build` output shows a separate async JS chunk for `AnalyticsView`.
- [ ] **Step 4: Commit `v0.3`, tag `v0.3`, and export clean snapshot**
  Commit: `git add . && git commit -m "feat(v0.3): add full daily schedule, goal breakdown, and lazy-loaded analytics dashboard"`
  Tag: `git tag -a v0.3 -m "v0.3: full schedule drag-and-drop, goal breakdown, lazy SVG analytics, and unit tests"`
  Export clean snapshot (excluding `node_modules`, `.git`, `dist`) to `e:\网站项目\submission\05_迭代版本快照\v0.3\`.

---

## Milestone `v1.0` — 前端视觉精修、沉浸体验、PWA、GitHub 上线与比赛交付包

### Task 9: Web Audio Synthesis, Desktop Notifications, Fullscreen Immersive Mode, Settings/Backup Modal & Global Shortcuts

**Files:**
- Create: `e:\网站项目\pomodoro-planner\src\utils\audioEngine.ts`
- Create: `e:\网站项目\pomodoro-planner\src\components\timer\ImmersiveOverlay.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\modals\SettingsModal.tsx`
- Create: `e:\网站项目\pomodoro-planner\src\components\modals\ShortcutsModal.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\context\TimerContext.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\components\timer\TimerCard.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\components\layout\Header.tsx`
- Modify: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Produces in `src/utils/audioEngine.ts`: `playCompletionChime(volume: number): void`, `setAmbientNoise(mode: AppSettings['ambientNoise'], volume: number): void`, `stopAmbientNoise(): void`.
- Produces: Document `<title>` live countdown (`MM:SS · 专注中 - 番茄计划`), Notification API prompt & dispatch on phase completion, `ImmersiveOverlay` (`F` / `Esc`), `SettingsModal` (durations, intervals, auto-start, sound/ambient controls, notifications, theme, JSON export/import/reset), `ShortcutsModal` (`?`), global keydown listener (`Space`, `R`, `N`, `F`, `1`, `2`, `3`, `?`, ignored inside editable inputs).

- [ ] **Step 1: Implement `src/utils/audioEngine.ts`**
  Pure Web Audio API synthesis: gentle 3-note harmonic bell chime (`C5-E5-G5` sine/triangle decay envelope) and smoothly filtered noise buffers (`rain` bandpass/lowpass modulated noise, `pink` Voss-McCartney filtered noise, `brown` integrated low-pass noise) with click-free gain ramping.
- [ ] **Step 2: Integrate audio, desktop notifications, and tab `<title>` updates into `TimerContext.tsx` and `TimerCard.tsx`**
  Add compact ambient sound selector + volume slider + fullscreen immersive toggle button on `TimerCard`.
- [ ] **Step 3: Implement `ImmersiveOverlay.tsx`, `SettingsModal.tsx`, `ShortcutsModal.tsx`, and wire global keyboard shortcuts in `App.tsx`**
- [ ] **Step 4: Verify & commit**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Expected: PASS.
  Commit: `git add src/ && git commit -m "feat(focus): add Web Audio chimes/ambient noise, immersive mode, settings/backup modal, and keyboard shortcuts"`

---

### Task 10: Visual Polish, Mobile Bottom Nav, PWA Offline Support, GitHub Actions CI, Tag `v1.0` & Snapshot Export

**Files:**
- Create: `e:\网站项目\pomodoro-planner\public\favicon.svg`
- Create: `e:\网站项目\pomodoro-planner\src\components\layout\MobileNav.tsx`
- Create: `e:\网站项目\pomodoro-planner\.github\workflows\deploy.yml`
- Create: `e:\网站项目\pomodoro-planner\README.md`
- Create: `e:\网站项目\pomodoro-planner\docs\design.md` (copy of approved design spec)
- Modify: `e:\网站项目\pomodoro-planner\vite.config.ts`
- Modify: `e:\网站项目\pomodoro-planner\index.html`
- Modify: `e:\网站项目\pomodoro-planner\src\index.css`
- Modify: `e:\网站项目\pomodoro-planner\src\App.tsx`

**Interfaces:**
- Produces: PWA manifest (`name: '番茄计划 · Pomodoro Planner'`, `short_name: '番茄计划'`, `theme_color: '#F8F6F1'`, `background_color: '#F8F6F1'`, `display: 'standalone'`), Workbox precache service worker, GitHub Actions Pages workflow on push to `main`.

- [ ] **Step 1: Add custom warm-paper tomato `public/favicon.svg` and configure `vite-plugin-pwa` in `vite.config.ts`**
  Ensure `base` propagates cleanly into PWA `scope` and `start_url`, and update `index.html` meta tags (`theme-color`, `description`, favicon, apple-touch-icon).
- [ ] **Step 2: Add `MobileNav.tsx` and polish Warm Paper light/dark theme micro-interactions**
  Verify touch target sizes (≥ 44px on mobile), smooth `transform`/`opacity` transitions, focus rings, and zero horizontal overflow on 390px viewports.
- [ ] **Step 3: Add `.github/workflows/deploy.yml`, `README.md`, and `docs/design.md`**
  Workflow runs on `push` to `main` and `workflow_dispatch`: checkout → setup-node 22 → `npm ci` → `npm run test` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- [ ] **Step 4: Run full verification & bundle size check**
  Run: `npm run typecheck && npx vitest run && npm run build`
  Inspect `dist/` asset sizes (initial JS gzip target ~80–100KB; `AnalyticsView` in separate async chunk; `sw.js` & `manifest.webmanifest` present).
- [ ] **Step 5: Local browser visual & interactive QA check**
  Start `npm run preview`, open via browser subagent on desktop & mobile viewport, verify warm paper light/dark toggle, timer start/pause, task CRUD, goals tab, lazy analytics tab, and zero console errors.
- [ ] **Step 6: Commit `v1.0`, tag `v1.0`, and export clean snapshot**
  Commit: `git add . && git commit -m "feat(v1.0): polish warm-paper UI, add PWA offline support, mobile nav, and GitHub Pages CI"`
  Tag: `git tag -a v1.0 -m "v1.0: polished warm-paper Pomodoro Planner with PWA and GitHub Pages CI"`
  Export clean snapshot to `e:\网站项目\submission\05_迭代版本快照\v1.0\`.

---

### Task 11: Browser-Assisted GitHub Public Repo Creation, Push & Live GitHub Pages Verification

**Files:**
- Modify (only if repo name adjusted): `e:\网站项目\pomodoro-planner\README.md` (fill in exact verified live URL & repo URL)

- [ ] **Step 1: Open GitHub via browser subagent to create public repo `pomodoro-planner`**
  Delegate to `browser` subagent (`Model: "flash"`) to navigate to `https://github.com/new`. If GitHub prompts for sign-in/2FA, pause and ask the user to log in inside the visible browser window, then resume the same browser subagent to create public repository `pomodoro-planner` (empty, no README/gitignore/license) and return the exact repo URL and GitHub username.
- [ ] **Step 2: Push `main` branch and all tags (`v0.1`, `v0.3`, `v1.0`) to GitHub**
  Configure `git remote add origin <repo-url>`, push `main` and `--tags`.
- [ ] **Step 3: Enable GitHub Pages (`GitHub Actions` source) and verify workflow deployment**
  Use the same browser subagent to open `<repo-url>/settings/pages`, set Build and deployment Source to **GitHub Actions** (if not auto-configured), and monitor `<repo-url>/actions` until the deploy workflow turns green.
- [ ] **Step 4: Live-verify the public GitHub Pages site**
  Navigate the browser subagent to `https://<username>.github.io/pomodoro-planner/`, confirm the app renders cleanly with zero 404s or console errors, test switching tabs & dark mode, and capture verification screenshot.
- [ ] **Step 5: Update `README.md` with exact live URL & commit/push**
  If `README.md` had placeholder username, update it to the real verified GitHub Pages URL, commit (`docs: add verified live GitHub Pages URL to README`), push to `main`, and refresh `v1.0` snapshot.

---

### Task 12: Competition Submission Archive Assembly (`e:\网站项目\pomodoro-planner-比赛提交包.zip`)

**Files:**
- Create: `e:\网站项目\submission\01_项目访问与仓库说明.md`
- Create: `e:\网站项目\submission\02_一页功能说明.md`
- Create: `e:\网站项目\submission\02_一页功能说明_打印版.html`
- Create: `e:\网站项目\submission\03_创作过程档案_Prompt日志.md`
- Create: `e:\网站项目\submission\05_迭代版本快照\CHANGELOG.md`
- Create: `e:\网站项目\pomodoro-planner-比赛提交包.zip`

- [ ] **Step 1: Author `01_项目访问与仓库说明.md`**
  Include live GitHub Pages URL, public GitHub repository URL, Git tag links (`v0.1`, `v0.3`, `v1.0`), local run commands (`npm install && npm run dev`), and folder guide for judges.
- [ ] **Step 2: Author `02_一页功能说明.md` and printable A4 single-page `02_一页功能说明_打印版.html`**
  Cover concisely on one page: what the web app does, every button & module (timer controls, ambient noise/immersive mode, today schedule CRUD/drag/rollover, goal breakdown, analytics charts & history backfill, theme/shortcuts/JSON backup), step-by-step usage guide, and keyboard shortcuts table.
- [ ] **Step 3: Author `03_创作过程档案_Prompt日志.md`**
  Strictly structured 4-column Markdown table (`使用工具` | `我的 Prompt` | `AI 返回结果` | `我做的人工改动`) authentically tracing the entire collaboration from initial request → `/grill-me` 8 design decisions → competition archive addition → tech stack selection → design review & approval → `v0.1`/`v0.3`/`v1.0` build & browser QA → GitHub deployment, with clearly marked optional note at bottom if the user wants to append final personal tweaks before submission.
- [ ] **Step 4: Author `CHANGELOG.md`, copy clean `04_核心项目源码_v1.0/`, and zip everything**
  Use PowerShell `Compress-Archive` to create `e:\网站项目\pomodoro-planner-比赛提交包.zip` containing `01`–`05` cleanly (verify zero `node_modules` or `.git` bloat inside the ZIP and list ZIP entries to verify completeness).
