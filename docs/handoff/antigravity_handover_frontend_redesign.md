# 前端深度视觉重设计与体验优化交接文档（Zero-Context Handover）

> **交接对象**：负责**前端 UI/UX 视觉重设计与交互美学升级**的下一位 AI 工程师 / 前端设计总监  
> **交接日期**：2026-11-24  
> **本地仓库路径**：`e:\网站项目\pomodoro-planner\`  
> **GitHub 公开仓库**：https://github.com/chenyanzou/pomodoro-planner  
> **线上部署地址**：https://chenyanzou.github.io/pomodoro-planner/

---

## 一、角色定位与核心红线

### 1. 你的角色
你是本项目（**番茄计划 · Pomodoro Planner**，用于个人使用与高校 AI 应用比赛）的**首席前端视觉设计师与 UI 动效工程师**。目前底层逻辑、防漂移计时引擎、数据存储、单元测试与 GitHub Pages 自动部署均已全部跑通并验证稳定，**你当前唯一且核心的使命，是把这套“功能很扎实、但外观还偏模板化/偏素”的界面，彻底打磨成具有高级设计感、强记忆点、极佳精致度与愉悦微交互的作品级前端**。

### 2. 不可逾越的核心红线
1. **绝不破坏已锁定的核心业务逻辑与单测**：
   - `src/utils/` 下的纯逻辑模块（`timerEngine.ts`、`date.ts`、`storage.ts`、`analytics.ts`、`backup.ts`、`reorder.ts`、`validators.ts`、`audioEngine.ts`）均已稳定且有 22 项 Vitest 单元测试保护，原则上只改 UI/样式/组件层；任何改动提交前必须确保 `npm run typecheck`、`npm test`（22/22 全绿）、`npm run build` 全部通过。
2. **保持静态纯前端与极致轻量化约束**：
   - 托管在 GitHub Pages（子路径 `/pomodoro-planner/`），严禁引入后端依赖；
   - **严禁引入数百 KB 的重型 UI/图表库**（不要引 AntD/MUI/ECharts/Chart.js，继续用 Tailwind CSS v4 + 自定义轻量 SVG + 精细 CSS 动效）；
   - **禁止依赖国内易超时的外部 WebFont 或外部音频 CDN**（若要引入优雅字体，优先使用精心搭配的系统字栈或轻量子集本地托管，避免阻塞首屏）；
   - 保持 `AnalyticsView` 的 `React.lazy` 路由级懒加载拆包；
   - 保持 `vite.config.ts` 中的 `base: process.env.VITE_BASE_PATH || '/pomodoro-planner/'` 与 `vite-plugin-pwa` 配置完整。
3. **保留“默认纯净空白 + 顶栏小月亮旁「演示」按钮”交互契约**：
   - 新用户首次访问必须为空白工作区；
   - 顶部主题切换（小月亮/太阳）按钮旁的「演示 / 退出演示」按钮必须保留且突出易用，且维持 `realState` 与 `demoState` 内存隔离（不覆盖用户 `localStorage`）。
4. **70% 上下文换窗交接铁律**：
   - 若上下文占用达到 **≥ 70%**，或完成重大改版里程碑后准备进入下一重阶段前，必须先跑通验证并提交 Git（打里程碑 Tag），再自写零上下文交接文档至 `docs/handoff/` 提示用户换窗接棒，严禁在单一窗口硬撑导致前序约束遗忘。

---

## 二、当前 Git 状态与已锁定里程碑（严禁重做）

- **当前分支**：`main`（已关联 `origin` = `git@github.com:chenyanzou/pomodoro-planner.git`）
- **当前最新功能 Commit**：`96c3279`（Tag：`v1.0.1`）
- **已锁定历史里程碑 Tags（已全部推送至 GitHub）**：
  - `v0.1`：防漂移番茄钟 + 基础今日任务清单 MVP（12 项单测）
  - `v0.3`：完整日排程、拖拽排序、目标拆解、懒加载 SVG 复盘统计、JSON 备份校验（18 项单测）
  - `v1.0`：Web Audio 纯合成钟声与 3 种白噪音、全屏沉浸模式、全局快捷键、移动端底部导航、PWA 离线预缓存、GitHub Actions 自动部署（22 项单测 + 浏览器实测全过）
  - `v1.0.1`：改为默认纯净空白启动 + 顶栏小月亮旁内存隔离「演示 / 退出演示」按钮
- **自动部署机制**：推送到 `origin main` 后，`.github/workflows/deploy.yml` 会自动执行 `npm ci` → `npm test` → `npm run build` → 部署至 https://chenyanzou.github.io/pomodoro-planner/（约 45 秒生效）。

---

## 三、精简必读锚点（接手后只先读这 5 个文件，不要狂读全仓）

1. `docs/design.md` — 原始产品规格与单事实来源契约（只扫第 3、4、5 节即可）；
2. `src/index.css` — 当前全部浅/深双主题 CSS Variables、纸张卡片阴影、字体栈与微动效；
3. `src/App.tsx` — 整体布局壳、演示模式横幅、快捷键守卫与三视图路由；
4. `src/components/layout/Header.tsx` & `src/components/timer/TimerCard.tsx` — 顶部导航与核心番茄钟视觉主视觉区；
5. `src/components/schedule/SchedulePanel.tsx` & `src/components/schedule/TaskItem.tsx` — 右侧计划安排表与任务卡片交互区。

（其余视图在具体美化对应模块时再按需读取：`src/components/goals/GoalsView.tsx`、`src/components/analytics/*.tsx`、`src/components/timer/ImmersiveOverlay.tsx`、`src/components/modals/*.tsx`、`src/components/layout/MobileNav.tsx`。）

---

## 四、隐藏规律、踩坑记录与待关闭风险（血泪经验，切勿回退！）

1. **React 19 `setState` 批处理陷阱（已修，严禁回退）**：
   - `AppDataContext.tsx` 中使用 `stateRef` 与 `isDemoRef` 在 `setState` 外部同步读取快照，确保删除任务/记录后的 **5 秒撤销 Toast** 与顺延计数 100% 触发。切勿把 Toast 逻辑挪回 `setState(prev => ...)` 更新器内部。
2. **高频/低频 Context 拆分（已修，严禁破坏）**：
   - `TimerContext.tsx` 已拆分为低频 `useTimerActions()`（给 `App.tsx` 和 `SchedulePanel.tsx`）与高频 `useTimer()`（仅给 `TimerCard.tsx` 和 `ImmersiveOverlay.tsx`），防止倒计时每秒跳动导致整个任务列表重渲染。改写 UI 时务必保持 `SchedulePanel` 只订阅 `useTimerActions()`。
3. **390px 移动端网格横向溢出坑（已修，改布局时务必复查）**：
   - CSS Grid 子列必须保留 `min-w-0`，`TaskItem` 内的备注等长文本必须保留 `min-w-0 max-w-full`，否则超长中文会把单列 Grid 撑宽到 > 390px。
4. **深色模式对比度坑**：
   - 此前深色模式下 `--text-secondary` 过暗导致导航 Tab 与次级按钮看不清，已在 `index.css` 调亮；重设计暗色主题时务必保证 Tab、胶囊筛选器、图标按钮在深色背景上达到清晰可读的 WCAG AA 对比度。
5. **键盘快捷键与弹窗防冲突**：
   - `App.tsx` 通过检查 `document.querySelectorAll('[role="dialog"]')` 暂停全局快捷键，新做的弹窗/抽屉务必保留 `role="dialog"` 与 `aria-modal="true"`。
6. **历史记录的 5 项低优先级可顺手优化项（Deferred Minors）**：
   - 数字输入框（番茄数/时长）目前在 `onChange` 即时钳制，改为草稿态 + `onBlur` 校验可让清空重输更顺滑；
   - `SessionHistory` 手动补录过去日期时目前用 `Date.now()` 排序，可改为按 `date` + `endedAt` 排序，并给超过 40 条的历史记录加“加载更多”；
   - `SchedulePanel` 日期选择器目前把 `<input type="date" className="sr-only">` 嵌套在 `<button>` 中，可重构为标准非嵌套标签触发，兼容更多浏览器；
   - 目标删除可补充轻量确认态或撤销 Toast；
   - PWA `manifest` 可补充 `lang: 'zh-CN'` 与 192/512 PNG 图标以优化 iOS 添加主屏观感。

---

## 五、紧邻下阶段精确目标与验收标准（Frontend Aesthetic Redesign）

### 1. 现状诚实诊断：为什么用户觉得当前前端“还太丑”？
当前 `v1.0.1` 的前端属于**“工整但平庸的通用 Tailwind 卡片堆叠”**：
- **缺少视觉焦点与高级材质感**：背景是纯平单色，卡片只是常规白底+细边框，缺乏精致的纸张纹理/柔和径向氛围光晕/精雕细琢的视觉层次；
- **番茄钟表盘缺乏“心动感”**：当前只是单一细圆环 + 静态黑字，缺少精美的刻度/发光进度端点/专注与休息切换时的情绪氛围过渡/呼吸脉冲微动效；
- **右侧计划表控件略显杂乱**：快速录入条下方的原生 `<select>` 下拉框带有系统默认丑样式，缺乏统一的精致定制胶囊/分段选择器质感；
- **空白初始状态（Empty State）太单薄**：现在默认空白启动后，空状态只是一个虚线框加一行灰色字，缺乏优雅的定制 SVG 插画、视觉呼吸感与引导点击（包括清晰优雅地引导体验或创建第一个计划）；
- **统计图表与目标卡片偏“后台表单感”**：还可以更具现代效率旗舰应用（如 Things 3、Linear、Amie、Craft、Forest）的审美精致度与动效流畅度。

### 2. 本阶段重设计核心方向（建议全面升维）
1. **建立真正有辨识度的美学体系（高定暖纸编辑风 / Editorial Studio + 精致暗夜书房风）**：
   - 精细化色彩层次、微妙的纸面噪点或柔和顶光氛围渐变（专注态微暖红晕，休息态微沁鼠尾草绿晕，平滑过渡）；
   - 更有设计感的字体排版比例、字距、数字等宽视觉节奏与卡片留白韵律。
2. **重塑核心主视觉：仪式感番茄钟表盘（`TimerCard` + `ImmersiveOverlay`）**：
   - 设计更精致的多层 SVG 仪表盘（细腻刻度线、柔和渐变弧线、进度端点微光圆珠、运行时的轻柔呼吸光环）；
   - 沉浸模式打造成“让人一打开就想专注”的极简艺术屏保级体验（随专注/休息阶段柔和变换氛围背景）。
3. **全面美化表单控件、任务卡片与空状态**：
   - 彻底告别生硬原生 `<select>` 观感，统一为精致胶囊选择/自定义样式按钮；
   - 优化任务卡片的信息密度与微交互（勾选完成时的愉悦弹性动效、激活绑定的微妙呼吸边框、拖拽时的细腻浮起阴影）；
   - 为「今日计划表」「目标拆解」「复盘统计」打造精致的定制 SVG 空状态插画与一键行动引导（如直接引导快速添加任务或点顶栏「✨ 演示」体验）。
4. **升维目标卡片与复盘可视化图表**：
   - 增强柱状图渐变与悬浮高亮气泡、环图精致中心指标与平滑交互、12 周热力图圆润微光与月标、KPI 卡片更具呼吸感与视觉节奏。
5. **微动效与跨端细节打磨**：
   - 视图切换、弹窗弹出、Toast 进出、深浅主题切换更丝滑自然（仍严格尊重 `prefers-reduced-motion`）；
   - 桌面端（1280px+）与移动端（390px）双端精致无瑕疵。

### 3. 验收标准（必须全部达成才能算完成）
- [ ] `npm run typecheck` 通过（0 错误）；
- [ ] `npm test` 全部通过（≥ 22 项，0 失败）；
- [ ] `npm run build` 成功，首屏体积保持轻盈（无重型第三方图表/UI 库，统计页仍为独立懒加载 chunk，PWA Service Worker 正常生成）；
- [ ] 真实浏览器截图验收通过：
  - 桌面端浅色 & 深色主题（空态 + 点击「演示」后的饱满态）；
  - 390px 移动端视口横向溢出为 `0px`，底部导航与卡片美观不拥挤；
  - 0 控制台报错、0 失败请求；
- [ ] 推送至 `origin main` 并确认 GitHub Actions 部署绿色通过、线上 https://chenyanzou.github.io/pomodoro-planner/ 实测生效。

---

## 六、后续全局路标

1. **阶段 A（下一窗口立即执行）**：按本交接文档完成前端深度视觉重设计与交互美学升级，通过本地与浏览器双端验收后提交并打标签 `v1.1`（或 `v2.0`），推送自动更新 GitHub Pages。
2. **阶段 B（赛前最终收口）**：更新 `e:\网站项目\submission\` 中的 `04_核心项目源码`、新增新版快照目录、同步把“引入第二位 AI 专项执行前端视觉重设计”作为最亮眼的**多轮人机协同优化案例**写进 `03_创作过程档案_Prompt日志.md`，重新生成最终版 `e:\网站项目\pomodoro-planner-比赛提交包.zip`。
