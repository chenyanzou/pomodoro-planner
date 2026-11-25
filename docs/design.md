# 番茄计划（Pomodoro Planner）项目设计文档

- **日期**：2026-11-24
- **仓库名**：`pomodoro-planner`（GitHub 公开仓库 + GitHub Pages 静态部署）
- **在线访问形态**：`https://<github-username>.github.io/pomodoro-planner/`（免登录、所有人可直接访问）
- **背景与用途**：为个人效率管理与学校 AI 使用比赛打造的纯前端番茄钟计划安排表 Web 应用，同步产出真实三阶段迭代档案（`v0.1` → `v0.3` → `v1.0`）、一页功能说明与四栏式 Prompt 创作过程日志压缩包。

---

## 1. 意图与目标（Intent & Why）

### 1.1 为什么做这个项目
1. **实用需求**：把“时间聚焦（番茄钟）”与“目标与日程规划（今日计划表 + 长期目标拆解）”融为一体，让每个番茄钟都有明确归属的任务与目标，而不是孤立的倒计时器。
2. **公开可访问、零门槛**：部署在 GitHub Pages，任何访问者（包括比赛评委与同学）点开链接即可直接使用，无需注册账号，且每个人的数据独立持久化保存在本地浏览器中。
3. **高完成度前端优化展示**：在视觉质感（暖纸极简 × 浅/深双主题）、运行性能（轻量无重型依赖、路由懒加载、零外链阻塞）、交互流畅度（防漂移计时、快捷键、拖拽排序、Web Audio 纯合成音效、PWA 离线可用）上达到现代效率应用水准。
4. **比赛交付闭环**：提供真实的 `v0.1` → `v0.3` → `v1.0` 迭代轨迹、GitHub 公开仓库、线上演示链接、一页功能说明和创作过程 Prompt 日志压缩包。

### 1.2 目标（Goals）
- 完整的番茄钟引擎：自定义专注/短休/长休/长休间隔，基于 `endTimestamp` 防止后台标签页休眠漂移，刷新页面自动恢复状态。
- 完整的计划与目标增删改查（CRUD）：今日计划表支持按日切换、时段分组、优先级、预估/已完成番茄数、拖拽排序、一键绑定当前番茄钟、未完成任务一键顺延至明天；目标视图支持大目标管理与一键拆解为具体日期的任务。
- 专注辅助体验：网页标签页标题实时显示倒计时、浏览器桌面通知、Web Audio API 纯代码合成的结束提示音与轻量白噪音（雨声/暖粉噪/壁炉低噪，零外部音频外链）、一键全屏沉浸模式。
- 轻量复盘统计看板：今日/本周/本月专注概览、近 7/30 天专注趋势柱状图、按目标分类的时间占比环图、近 12 周专注热力图、可回看/补录/删改的历史专注流水。
- 本地持久化 + JSON 备份：版本化存储架构，支持一键导出 JSON 备份、校验后导入恢复及重置示例数据。
- 前端深度优化：暖纸极简双主题、全响应式（桌面双栏 + 移动端底部导航/单栏）、全局快捷键、PWA 离线安装、首屏高轻量与核心功能单元测试覆盖。
- 自动化上线与比赛材料包：内置浏览器协助在用户 GitHub 账号新建公有仓库 `pomodoro-planner`，配置 GitHub Actions 自动部署 GitHub Pages，打包包含 `v0.1`/`v0.3`/`v1.0` 快照、一页功能说明、四栏 Prompt 日志的竞赛压缩包。

### 1.3 非目标（Non-Goals）
- 不建设后端服务器、用户注册登录体系或云端多设备实时同步。
- 不做多人协作共享计划板（每个访问者在自己浏览器里独立管理自己的计划）。
- 不做中英双语切换（界面统一为高质量简体中文，品牌副标题保留 `Pomodoro Planner`）。
- 不引入 ECharts / Chart.js / 复杂 UI 框架等数百 KB 重型依赖。

### 1.4 反目标（Anti-Goals：绝对避免的失败形态）
- **计时器后台偷停或刷新归零**：如果用户切去写文档 20 分钟回来发现番茄钟才走 3 分钟，产品即失败。
- **外部字体或音频资源失效导致白屏/报错**：不能依赖国内易超时或易失效的第三方 CDN 音频/字体链接。
- **GitHub Pages 子路径资源 404**：若未正确配置 `base: '/pomodoro-planner/'` 与相对静态资源路径，线上打开会白屏。
- **敷衍的伪迭代版本**：`v0.1`、`v0.3`、`v1.0` 必须是真正按阶段逐步构建、可独立编译运行的 Git 提交与快照，而非事后复制同一份代码改版本号。

---

## 2. 技术方案对比与最终决策（Approaches）

我们评估了 3 套实现方案，最终由用户确认为 **方案 A**：

| 方案 | 技术栈 | 权衡结论 |
| :--- | :--- | :--- |
| **方案 A（已选定）** | **React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + 轻量定制 SVG 图表 + 原生 Pointer/HTML5 拖拽 + `vite-plugin-pwa`** | 兼顾工程规范、类型安全、视觉定制自由度与极致体积优化（无重型图表/组件库，统计页懒加载），最适合 `v0.1 → v0.3 → v1.0` 清晰演进与前端性能优化展示。 |
| 方案 B | React + TypeScript + Vite + Recharts + dnd-kit + 重型 UI 库 | 首屏打包体积大（250–400KB+），视觉与动效定制受限，违背轻量化前端优化初衷。 |
| 方案 C | 零构建纯原生 HTML + CSS + ES Modules | 多视图状态联动（番茄钟、日排程、目标汇总、热力图、快捷键、PWA）下手动同步 DOM 易出边界缺陷，工程可维护性弱。 |

---

## 3. 核心架构与数据模型

### 3.1 数据持久化策略（架构师决策）
- 使用 `localStorage` 作为主存储（单键版本化 JSON：`pomodoro_planner_state_v1`，搭配独立高频计时状态键 `pomodoro_planner_timer_v1` 避免每秒序列化整棵任务树），读写同步零延迟、刷新即刻恢复。
- 当用户导出数据时，打包为带 `schemaVersion: 1`、`exportedAt` 元信息的 `.json` 文件；导入时执行严格运行时字段校验（验证日期格式、数值范围、引用完整性），校验失败时友好提示且不破坏现有数据。
- **首次访问体验（Builder Call）**：首次打开且本地无数据时，提供一组精简、可一键清空的**中文引导示例任务与目标**（标记 `isSample` 或提供“清空示例/重置”提示），让评委或新访客一打开就能直观感受到计划表、目标拆解与统计图表的完整效果，同时可立刻增删改。

### 3.2 核心实体类型定义（TypeScript Schema）

```ts
export type Priority = 'high' | 'medium' | 'low';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  color: string;          // 预置暖纸和谐色板 token
  targetPomodoros: number; // 目标总番茄数（>= 1）
  deadline?: string;       // YYYY-MM-DD 可选截止日期
  archived: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  note?: string;
  date: string;            // 归属日期 YYYY-MM-DD
  timeSlot: TimeSlot;      // 上午 / 下午 / 晚上 / 自由时段
  priority: Priority;      // 高 / 中 / 低
  goalId?: string;         // 可选关联目标 ID
  estimatedPomodoros: number; // 预估番茄数（1..16）
  completedPomodoros: number; // 已完成番茄数（>= 0）
  completed: boolean;
  order: number;           // 同日期内排序权重
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitleSnapshot: string; // 删除任务后历史记录仍保留可读名称
  goalId?: string;
  goalTitleSnapshot?: string;
  goalColorSnapshot?: string;
  phase: 'focus';          // 统计仅计入专注记录
  durationMinutes: number; // 实际专注分钟数
  date: string;            // YYYY-MM-DD（按本地时区）
  startedAt: number;
  endedAt: number;
  note?: string;
}

export interface AppSettings {
  focusMinutes: number;        // 默认 25（范围 1..120）
  shortBreakMinutes: number;   // 默认 5（范围 1..60）
  longBreakMinutes: number;    // 默认 15（范围 1..90）
  longBreakInterval: number;   // 默认 4 轮后长休（范围 2..8）
  autoStartBreak: boolean;     // 默认 false
  autoStartFocus: boolean;     // 默认 false
  soundEnabled: boolean;       // 默认 true（Web Audio 提示音）
  soundVolume: number;         // 0..1，默认 0.65
  ambientNoise: 'off' | 'rain' | 'pink' | 'brown'; // 默认 'off'
  ambientVolume: number;       // 0..1，默认 0.35
  notificationsEnabled: boolean; // 浏览器桌面通知开关
  theme: 'light' | 'dark' | 'system'; // 默认 'light'（暖纸风首发惊艳，一键切深色）
}

export interface PersistedTimerState {
  phase: TimerPhase;
  status: 'idle' | 'running' | 'paused';
  remainingSeconds: number;    // idle/paused 时生效
  endTimestamp: number | null; // running 时以 Date.now() 差值计算剩余秒数
  startedAt: number | null;
  totalSeconds: number;        // 本轮设定总秒数（用于圆环进度与实际时长计算）
  completedFocusCycles: number; // 当前长休周期计数
  activeTaskId: string | null;
}
```

### 3.3 数据单一事实来源与同步契约（Builder Call）
为避免任务卡片、目标进度条与复盘统计看板在手动编辑后出现口径冲突，确立以下明确契约：
- **`FocusSession[]` 为时间统计与复盘的唯一事实来源**：今日顶部累计专注分钟数、周/月 KPI、近 7/30 天趋势柱状图、按目标分类占比环图、12 周热力图与历史流水均严格由 `FocusSession[]` 实时聚合得出。
- **`Task.completedPomodoros` 为任务级执行进度计数**：用于任务卡片的 `🍅 2/3` 进度与完成感展示。
  - **自动联动**：当绑定了某任务的专注番茄自然结束时，原子操作同时执行 `Task.completedPomodoros += 1` 与新增 1 条 `FocusSession`。
  - **手动编辑互不造假**：在任务弹窗中手动修改 `completedPomodoros` 仅调整任务进度计数，不伪造带时间戳的历史 `FocusSession`；在复盘统计页删除、修改或补录 `FocusSession` 实时重算所有图表与今日专注分钟数，不静默篡改历史任务状态。
- **目标进度与历史归属**：目标卡片进度条汇总关联任务的 `completedPomodoros / targetPomodoros`，同时展示该目标在 `FocusSession` 中的累计专注分钟数；任务后续若改绑其他 `goalId` 或被删除，其**既往已记录的 `FocusSession`** 保持记录发生时的 `goalId`/`goalTitleSnapshot` 快照不变，确保历史复盘真实可追溯。

### 3.4 防漂移计时与刷新恢复机制
- 启动计时时记录 `endTimestamp = Date.now() + remainingSeconds * 1000` 并立即写入 `pomodoro_planner_timer_v1`。
- 渲染层使用 `250ms` 间隔（外加 `visibilitychange` 事件在切回标签页时立刻刷新）计算 `Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000))`。
- 若页面关闭/刷新超过 `endTimestamp`，重新打开时检测到本轮已在离线期间结束：若为 `focus` 阶段，自动补记该条 `FocusSession`（并更新对应任务的 `completedPomodoros`），状态平滑流转至下一阶段并弹出轻量 Toast 提示“刚才的专注已自动完成并记录”。
- 任务删除时：若被删任务正好是 `activeTaskId`，自动解绑 `activeTaskId = null`，但不中断当前正在运行的计时器；历史 `FocusSession` 保留 `taskTitleSnapshot` 不受影响。

---

## 4. 界面架构与视觉设计规范（暖纸极简 × 现代精致风）

### 4.1 色彩与字体系统
- **浅色模式（暖纸极简默认）**：
  - 画布底色：`#F8F6F1`（温润米白纸感）
  - 卡片表面：`#FFFFFF` / 次级表面 `#F1EDE4`
  - 边框细线：`#E6E0D4`
  - 主文字：`#1F1D1A` / 次文字 `#6B655B` / 弱文字 `#9C9488`
  - 专注主色（朱砂番茄红）：`#D95338`（悬停 `#C0432A`，柔底 `#FDECE7`）
  - 休息主色（鼠尾草绿）：`#4D8B6F`（柔底 `#E8F3EE`）
  - 目标分类和谐色板（6 色）：番茄红 `#D95338`、琥珀金 `#C88A2E`、鼠尾草 `#4D8B6F`、青黛蓝 `#4A7C9B`、梅子紫 `#866196`、暖褐 `#8C6B52`
- **深色模式（暖炭灰护眼）**：
  - 画布底色：`#171614`
  - 卡片表面：`#211F1C` / 次级表面 `#2A2723`
  - 边框细线：`#35312B`
  - 主文字：`#F2EFE9` / 次文字 `#ACA59A`
  - 专注主色：`#E86C52` / 休息主色：`#66A88A`
- **排版规范**：
  - 系统高性能中文无衬线字体栈（`"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Inter", system-ui, sans-serif`），零网络字体阻塞。
  - 所有倒计时、日期、番茄计数与统计数字强制启用 `font-variant-numeric: tabular-nums`（等宽数字，跳秒完全不抖动）。

### 4.2 页面结构与布局草图

**桌面端（≥ 1024px）**：顶部极简导航栏（品牌 + 3 主视图切换：今日专注 / 目标拆解 / 复盘统计 + 日期/主题/设置/快捷键入口）+ 黄金双栏主区：

```text
+-----------------------------------------------------------------------------+
| 🍅 番茄计划    [ 今日专注 ]  [ 目标拆解 ]  [ 复盘统计 ]      [☀/🌙] [?] [⚙]  |
+-------------------------------+---------------------------------------------+
|  [ 专注 ]  [ 短休 ]  [ 长休 ]  |  <  2026年11月24日 · 今天  >    [顺延未完成] |
|                               |  -----------------------------------------  |
|        ╭───────────╮          |  今日进度: ████░░ 4/6 番茄 · 100分钟         |
|       │    24:38    │         |                                             |
|        ╰───────────╯          |  [+ 快速添加今日任务...   时段▾ 优先级▾ 目标▾] |
|                               |                                             |
|  当前专注：完成算法作业第三章    |  上午                                        |
|  [  暂停 (Space)  ]  [重置][⏭] |   ≡ ○ [高] 完成算法作业第三章   🍅 2/3  [▶][✎][🗑] |
|                               |   ≡ ✓ [中] 复习英语高频词汇     🍅 1/1  [✎][🗑]    |
|  🎧 白噪音: [雨声 ▾]  [⛶ 沉浸] |  下午                                        |
|                               |   ≡ ○ [高] 撰写前端性能优化报告 🍅 1/2  [▶][✎][🗑] |
+-------------------------------+---------------------------------------------+
```

**移动端（< 1024px）**：顶部精简标题与主题/设置按钮 + 单栏垂直滚动 + 固定底部 3-Tab 导航栏（今日专注 / 目标拆解 / 复盘统计），交互触控区 ≥ 44px。

**全屏沉浸模式（`F` 或按钮触发）**：淡出计划列表与导航，仅留柔和背景、超大 SVG 环形倒计时、当前任务名、启停与白噪音控件，按 `Esc` 或点击退出恢复。

---

## 5. 各功能模块详述

### 5.1 番茄钟模块
- 支持手动切换 `专注 / 短休 / 长休`，底部圆点指示当前处于第几轮番茄。
- 倒计时结束后：
  - 自动累加当前绑定任务的 `completedPomodoros`（可超过预估数，表示超额投入）；
  - 写入一条 `FocusSession` 历史记录；
  - 播放 Web Audio 合成的柔和三音钟声（如开启），并触发浏览器桌面通知（如已授权）；
  - 网页 `<title>` 在运行时显示 `24:38 · 专注中 - 番茄计划`，暂停/空闲恢复默认标题。
- Web Audio 纯代码白噪音引擎：内置「关闭 / 细雨声（滤波噪声）/ 粉红噪声 / 暖褐噪声」，无需下载 MP3，离线照常工作，支持独立音量滑块，并可配置“仅在专注计时运行期间播放或常开”（默认随音量控制即时开关，暂停可静音或保持，此处由 Builder 实现简洁可控的开关 + 音量滑块）。

### 5.2 今日计划安排表模块
- **日期导航**：前一天 / 回到今天 / 后一天 + 原生日期选择器快速跳转。
- **完整 CRUD**：
  - 顶部快速录入条（输入标题回车即添加，支持直接选时段、优先级、预估番茄数与所属目标）。
  - 点击任务编辑按钮打开精炼编辑抽屉/弹窗：修改标题、备注、归属日期、时段、优先级、预估/已完成番茄数、关联目标。
  - 删除支持即时轻量 Toast 提示与 **5 秒「撤销」按钮**，防止误删。
- **拖拽排序与跨时段调整**：支持同日内上下拖拽排序，也支持拖入不同时段分区（上午/下午/晚上/自由时段），桌面鼠标与触屏降级上下移动按钮双保险。
- **筛选与批量整理**：按状态（全部/待办/已完成）或目标过滤；当过去日期或当天仍有未完成任务时，提供“未完成顺延到今天/明天”一键整理按钮。

### 5.3 目标拆解视图
- 卡片式展示每个阶段/长期目标：颜色标签、标题、简介、截止倒计时、进度条（自动汇总历史已完成番茄 / 目标番茄数）、旗下待办与已完成任务数。
- 支持新建、编辑、归档/恢复、删除目标（删除目标时保留其下的历史任务与记录，仅解除关联）。
- 每个目标卡片内置 **「+ 拆解为今日任务」** 快捷入口，快速把大目标落到具体日期的计划表中。

### 5.4 轻量复盘统计看板（路由级懒加载 `React.lazy`）
- **4 张顶部指标卡**：今日专注（番茄数 & 分钟）、本周累计、本月累计、连续专注天数（Streak）。
- **近 7 天 / 近 30 天专注趋势柱状图**（纯定制响应式 SVG，带悬浮 Tooltip 显示准确日期与分钟数）。
- **按目标分类的时间占比环图**（纯定制 SVG Donut + 清晰图例与百分比，未关联目标归入“日常零散专注”）。
- **近 12 周专注热力图**（类似 GitHub 贡献格，使用暖纸番茄红 5 级色阶）。
- **可删改的历史专注流水**：按日期倒序展示每条专注记录（时间段、任务名、所属目标、时长、备注），支持**手动补录一条专注**、编辑备注/时长或删除记录（删除后所有图表实时重算）。

### 5.5 设置、备份与全局快捷键
- **设置弹窗**：专注/短休/长休时长、长休间隔、自动流转开关、提示音开关与音量、桌面通知授权按钮、浅色/深色/跟随系统主题切换。
- **数据备份**：一键导出带日期戳的 `pomodoro-planner-backup-YYYY-MM-DD.json`；导入时校验并预览导入条数后覆盖恢复；提供“恢复演示示例数据”与“清空全部数据”（二次确认）。
- **全局快捷键**（当焦点不在输入框/文本框内生效）：
  - `Space`：开始 / 暂停番茄钟
  - `R`：重置当前番茄钟
  - `N`：聚焦快速新建任务输入框
  - `F`：进入 / 退出全屏沉浸模式
  - `1` / `2` / `3`：切换 今日专注 / 目标拆解 / 复盘统计
  - `?`：打开快捷键速查面板

---

## 6. 前端性能优化与质量保障

1. **包体积与首屏优化**：零重型图表库、零外部 WebFont 阻塞、零外部音频资源；统计看板组件采用 `React.lazy + Suspense` 按需拆包；图标仅按需引入 `lucide-react`。
2. **渲染性能优化**：将高频跳秒的倒计时状态与低频变动的任务/目标树拆分为独立 Context/Store，避免每秒重渲染整个任务列表与统计视图；动效仅使用 `transform` 与 `opacity` 触发 GPU 合成，同时尊重 `prefers-reduced-motion`。
3. **PWA 离线体验**：通过 `vite-plugin-pwa` 生成 `manifest.webmanifest`（自定义番茄 SVG 图标 + 暖纸主题色）与 Service Worker 预缓存静态资源，支持手机/电脑“添加到主屏幕”并断网可用。
4. **自动化测试**：使用 Vitest 编写核心纯逻辑单元测试（计时器时间戳推演与离线完成恢复、长休轮次切换、JSON 导入校验、统计聚合与连续天数计算），配合 `tsc --noEmit` 与 `vite build` 严格验证。

---

## 7. 目录边界、真实三阶段迭代路线、GitHub 上线与比赛交付包

### 7.1 仓库与交付目录边界（Builder Call）
- **公有 Git 仓库根目录**：`e:\网站项目\pomodoro-planner\`（仅存放干净的开源项目代码、`README.md`、`.github/workflows/deploy.yml` 与项目设计文档，避免将临时快照或压缩包提交进公有仓库）。
- **Vite 部署子路径适配（Builder Call）**：`vite.config.ts` 中配置 `base: process.env.VITE_BASE_PATH || '/pomodoro-planner/'`，若建仓时目标名被占用而改名，仅需调整环境变量或一处默认值即可全线兼容 GitHub Pages 与 PWA `scope`/`start_url`。
- **比赛交付整理区**：`e:\网站项目\submission\`（位于 Git 仓库之外），用于无递归风险地归档 `v0.1`/`v0.3`/`v1.0` 纯净快照、比赛文档，并最终打包生成 `e:\网站项目\pomodoro-planner-比赛提交包.zip`。

### 7.2 连贯三阶段迭代路线（已用户确认）
采用**全自动连贯推进**（仅在内置浏览器操作 GitHub 需要账号登录/2FA 时请用户介入一次），仍严格按三个独立里程碑真实分步编码、运行测试与构建验证、提交 Git 并打 Tag：

1. **阶段 `v0.1` — 最小可用原型（MVP）**
   - 初始化 `e:\网站项目\pomodoro-planner\` Git 仓库，搭建 Vite + React + TypeScript + Tailwind 工程骨架与 GitHub Pages 基础配置。
   - 实现防漂移番茄钟基础引擎 + 今日基础待办任务增删改查 + `localStorage` 本地持久化。
   - 验证构建通过 → 提交 Git 并打标签 `v0.1` → 导出纯净快照至 `e:\网站项目\submission\05_迭代版本快照\v0.1\`。
2. **阶段 `v0.3` — 完整计划排程、目标拆解与复盘统计**
   - 升级今日计划表：日期切换、时段分组、优先级、拖拽排序、未完成顺延、删除撤销 Toast。
   - 新增「目标拆解」视图与一键拆解任务联动。
   - 新增懒加载「复盘统计看板」（KPI、7/30 天 SVG 柱状图、分类环图、12 周热力图、可增删改历史流水）与 JSON 导入导出备份。
   - 补齐核心逻辑 Vitest 单元测试 → 验证构建与测试通过 → 提交 Git 并打标签 `v0.3` → 导出纯净快照至 `e:\网站项目\submission\05_迭代版本快照\v0.3\`。
3. **阶段 `v1.0` — 前端视觉精修、沉浸体验、PWA 与上线交付**
   - 暖纸极简 × 深色暖炭双主题视觉打磨与动效精调；移动端响应式细节校验。
   - 接入 Web Audio 纯合成提示音与多模式白噪音、桌面通知、标签页标题倒计时、全屏沉浸模式与全局快捷键。
   - 配置 `vite-plugin-pwa` 离线支持与 GitHub Actions 自动部署工作流（`.github/workflows/deploy.yml`）。
   - 通过内置浏览器协助用户在 GitHub 创建公有仓库 `pomodoro-planner`、推送代码与全部 Tags（`v0.1`/`v0.3`/`v1.0`）、开启 GitHub Pages（GitHub Actions 源）并实地打开线上 URL 截图验证。
   - 生成比赛交付材料并打包为 `e:\网站项目\pomodoro-planner-比赛提交包.zip`：
     - `01_项目访问与仓库说明.md`（含真实公有 GitHub 仓库 URL 与已验证的线上 GitHub Pages URL）
     - `02_一页功能说明.md` + `02_一页功能说明_打印版.html`（一页纸讲清用途、所有按钮/功能、使用方法与快捷键）
     - `03_创作过程档案_Prompt日志.md`（严格含「使用工具—我的 Prompt—AI 返回结果—我做的人工改动」四栏真实记录：如实记录前期 `/grill-me` 8 轮需求决策、技术选型确认、各版本迭代与验收调优，并为赛前个人最终复核预留清晰可编辑标注）
     - `04_核心项目源码_v1.0/`（纯净可运行源码，不含 `node_modules`）
     - `05_迭代版本快照/`（`v0.1`、`v0.3`、`v1.0` 纯净源码快照 + `CHANGELOG.md` 变更演进对照）

---

## 8. 交由实现者决定的细节（Builder Calls）

以下细节已在设计中给出合理默认方案，实施时按需微调：
- 首次打开内置的 3 条中文演示任务与 2 个演示目标的具体文案，以及顶部一键“清空演示数据”按钮。
- 统计页面近 12 周热力图的响应式横向滚动与手机端精简显示细节。
- Web Audio 白噪音滤波器具体截止频率参数（确保听感柔和不刺耳）。
- 仓库 `README.md` 展示截图与徽章排版。
