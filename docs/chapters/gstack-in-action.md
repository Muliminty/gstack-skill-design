---
outline: deep
---

# 第 2 章 · gstack 实战：用 gstack 完成一个闭环项目

> 先用起来。这一章用一个真实小项目带你走完 gstack 的完整开发闭环。读完你能独立用 gstack 从零到一交付一个功能。

[[toc]]

## 项目：做一个命令行 TODO 工具

我们用 gstack 从零构建一个简单的 CLI TODO 工具。目标不是代码本身，而是**体会 gstack 每个 Skill 在什么阶段介入、解决什么问题**。

技术选型：Node.js + TypeScript，零依赖。

## Step 1：安装 gstack（30 秒）

在 Claude Code 中粘贴并执行：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

然后告诉 Claude 在 CLAUDE.md 中添加 gstack 配置：

> 在 CLAUDE.md 中添加 gstack 的 skill 配置，并开启 team mode

:::tip 关键技巧
Team mode 让整个团队共享 gstack 配置。`required` 强制每位成员使用，`optional` 只是提醒。对个人项目用 `optional` 即可。
:::

## Step 2：/office-hours — 搞清楚要做什么

在你准备开始编码的项目目录中，对 Claude Code 说：

> /office-hours 我想做一个命令行 TODO 工具，支持添加、完成、列出任务

gstack 的 office-hours 会用 Builder 模式问你一系列问题，帮你收敛需求：

- 最酷的版本长什么样？（你可能会说：终端里有漂亮的彩色输出）
- 最快的可分享版本是什么？（可能只是 3 个命令：add / done / list）
- 谁会用这个？（你自己，或者分享给同事）

:::tip 关键技巧
/office-hours 不是走过场。它的 6 个强迫性问题会逼你把模糊想法压缩成具体规格。跳过的创始人通常会在两周后返工。
:::

## Step 3：/plan-ceo-review + /plan-eng-review — 出方案

有了 /office-hours 的设计文档后：

> /plan-ceo-review 审视这个 TODO 工具的 scope——有没有应该做但没想到的？

CEO Review 有 4 种模式：
- **EXPANSION**：放大思考，找到 10 星产品
- **SELECTIVE EXPANSION**：保持 scope + 精选扩展
- **HOLD SCOPE**：锁定范围，最大化当前方案的完成度
- **REDUCTION**：砍到最小可行版本

对小项目用 **HOLD SCOPE**。

然后：

> /plan-eng-review 审查这个 TODO 工具的架构方案

eng-review 会检查：数据存储方案（文件还是 SQLite？）、CLI 参数解析、测试策略等。

:::tip 关键技巧
plan-ceo-review 负责"做对的事"，plan-eng-review 负责"把事做对"。两个都跑，不要跳。
:::

## Step 4：编码 + /review — 写代码 + 自动审查

让 Claude Code 开始写代码。写完之后，在分支上运行：

> /review

review skill 会：
- 检查 diff 中的安全漏洞（SQL 注入、XSS 等）
- 审查逻辑错误
- 检查是否有条件性副作用
- 自动修复明显问题

```typescript
// 例如 reviewer 可能会指出这种问题：
function loadTodos(): Todo[] {
  const data = fs.readFileSync(FILE, 'utf-8')
  return JSON.parse(data) // ❌ 如果文件不存在会 crash
}

// 并建议修复：
function loadTodos(): Todo[] {
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}
```

## Step 5：/qa — 浏览器里实测

如果你的项目有 Web 界面（这个 TODO CLI 没有，但假设你做了 TUI 或 web 版），QA skill 会启动真实的 Chromium 浏览器：

> /qa `https://localhost:3000`

它会自动点按钮、填表单、截图对比、找出渲染问题。但即便没有 UI，也可以考虑写自动化测试让 QA skill 跑。

## Step 6：/ship — 发布 PR

一切就绪后：

> /ship

ship 的工作流：
1. 合并 base branch（main）
2. 运行测试
3. 审查 diff
4. bump VERSION + 写 CHANGELOG
5. commit + push
6. 创建 PR

:::tip 关键技巧
/ship 不会跳过 hook，不会 force push。如果你有 pre-commit hook 失败，它会停下来让你修，修完重新 commit——不会 amend 到上一条。
:::

## 完整工作流回顾

```
你的想法
   │
   ▼
/office-hours ────── 搞清楚要做什么，产出一份设计文档
   │
   ▼
/plan-ceo-review ─── 审视 scope，确保做对的事
   │
   ▼
/plan-eng-review ─── 锁架构，画数据流图，列测试矩阵
   │
   ▼
编码 + /review ───── 写代码，每次改动后跑审查
   │
   ▼
/qa ──────────────── 浏览器实测，截图找 bug
   │
   ▼
/ship ────────────── 合并、测试、bump版本、提 PR
```

## 常见踩坑

- **不要在 /office-hours 之前跑 /plan-eng-review**——你会对一个还没定义好的问题做架构评审
- **/review 不是一次性的**——每次较大改动后都应该跑。AI 生成的代码天然需要更多 review，不是更少
- **/ship 之前确保 base branch 是最新的**——否则会有合并冲突
- **小型项目不需要 /cso**——安全审计对于个人 TODO 工具是 overkill。但一旦涉及用户数据，必须跑

## 下一步

现在你已经用 gstack 走完了一个完整闭环。接下来几章，我们深入拆解 gstack 最核心的几个 Skill，看它们**内部是怎么设计的**——以及你可以从中学到什么，用到你自己的 Skill 设计里。
