# AI训练师 知识考题题库

辅助掌握人工智能训练相关知识的自测工具，支持练习/考试/错题本/统计四种模式，包含 6 个模块共 550 道题目。

## 技术栈

- React 19 + TypeScript 6 + Vite 8
- react-router-dom v7（Hash 路由）
- 纯 CSS 自定义属性（移动端优先，PWA 支持）
- localStorage 持久化（无后端依赖）

## 快速开始

```bash
npm install
npm run dev      # 开发模式 → http://localhost:5173
npm run build    # 生产构建 → dist/
npm run lint     # ESLint 检查
```

## 项目结构

```
src/
├── main.tsx                  # 入口
├── App.tsx                   # 路由定义（HashRouter + 5 条路由）
├── index.css                 # 全局样式（CSS 变量 + 响应式）
├── types/index.ts            # 类型定义（Question, QuizRecord, QuizState 等）
├── data/questions.ts         # 编译后的 550 道题（由脚本生成）
├── utils/
│   └── quiz.ts               # 公共纯函数：getChapters, checkAnswer, buildRecord
├── components/
│   ├── Layout.tsx            # 导航栏 + Outlet
│   ├── QuestionCard.tsx      # 题目卡片（选项渲染 + 正误反馈 + 解析）
│   ├── QuizSetup.tsx         # 共享设置表单（章节选择 + 数量/时限滑块）
│   ├── QuizResult.tsx        # 共享结果展示（得分概览 + 逐题回顾）
│   ├── Timer.tsx             # 倒计时器（≤60s 红色闪烁）
│   └── WrongBookRetest.tsx   # 错题重考/练习组件
├── hooks/
│   ├── useQuiz.ts            # 答题状态机（抽题、选项、导航、交卷）
│   ├── useStorage.ts         # localStorage 绑定 hook
│   ├── useWrongBook.ts       # 错题本数据计算 + 掌握状态管理
│   └── useDataSync.ts        # 数据导出/导入逻辑
├── pages/
│   ├── Home.tsx              # 首页（题库概览 + 模式入口）
│   ├── Practice.tsx          # 练习模式（不限时，每题即时反馈）
│   ├── Exam.tsx              # 考试模式（限时，交卷后出成绩）
│   ├── WrongBook.tsx         # 错题本（列表 + 复习 + 重考入口）
│   └── Stats.tsx             # 答题统计 + 数据同步
└── scripts/
    └── parse-questions.mjs   # 将原始 .txt 解析为 questions.ts
```

## 功能模式

| 模式 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 题库概览，模式入口 |
| 练习 | `/practice` | 不限时，每题即时反馈，可查看解析后继续 |
| 考试 | `/exam` | 限时，统一交卷，单选/判断自动跳转，题号滑动窗口 |
| 错题本 | `/wrong-book` | 错题列表、逐题复习、限时重考、不限时练习、掌握标记 |
| 统计 | `/stats` | 正确率趋势、章节分析、数据 JSON 导出/导入 |

## 架构设计

### 职责分层

```
展示层   pages/ + components/   → 只调用 hooks，不直接操作 localStorage
业务层   hooks/                 → useQuiz / useStorage / useWrongBook / useDataSync
数据层   utils/quiz.ts + types/  → 纯函数，无副作用
存储层   localStorage           → quiz-records, wrong-mastered
```

### 数据流

```
questions.ts (静态题库)
    ↓
useQuiz(pool) → 打乱抽题 → 答题 → finish() → buildRecord()
    ↓
QuizRecord → useStorage('quiz-records') → localStorage
    ↓
useWrongBook() → 统计错题 → wrongQuestions / allWrong
```

### 设计决策

- **HashRouter**：兼容 GitHub Pages，无需服务端路由配置
- **localStorage 而非 IndexedDB**：数据量小（答题记录），无需复杂查询
- **无状态管理库**：应用规模可控，React hooks + useStorage 足够
- **纯 CSS 无框架**：移动端优先，利用 CSS 变量保持设计一致性

## 开发规范

- 新增共享逻辑优先放入 `utils/quiz.ts`（纯函数）或 `hooks/`（有状态）
- 页面组件只做调度和组合，不包含复杂计算逻辑
- 重复 UI 模式抽取为 `components/` 下的共享组件
- localStorage 操作统一通过 `useStorage` hook，不在组件中直接调用
- 类型定义集中在 `types/index.ts`，导出使用 `import type`

## 题目维护

1. 编辑 `AI训练题题库/` 下的原始 `.txt` 文件
2. 运行 `node scripts/parse-questions.mjs` 重新生成 `src/data/questions.ts`
3. 提交前验证：`npm run build`

## 部署

GitHub Actions 自动部署到 GitHub Pages（`.github/workflows/deploy.yml`），推送 main 分支触发。
