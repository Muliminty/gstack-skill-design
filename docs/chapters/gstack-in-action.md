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

## gstack 技能地图：它到底有哪些 Skill？

安装完 gstack 后，你得到的不是一个命令，而是一整套软件交付工作流。你可以把它理解成一个 AI 专家团队：产品合伙人、工程经理、设计师、QA、安全负责人、发布工程师都被编码成了不同的 Skill。

下面这张表基于 [gstack 官方 skills 文档](https://github.com/garrytan/gstack/blob/main/docs/skills.md)整理。读完不用全部记住，只要知道"遇到什么问题该叫谁"。

### 只看核心闭环

如果你现在只想把一个功能从想法推进到 PR，先记住这 6 个就够了：

| 阶段 | Skill | 你要它解决的问题 |
| --- | --- | --- |
| 想清楚 | `/office-hours` | 这个东西到底值不值得做？最小、最酷、最清晰的版本是什么？ |
| 做对事 | `/plan-ceo-review` | scope 是否太小、太散或太保守？有没有 10 星产品机会？ |
| 把事做对 | `/plan-eng-review` | 架构、数据流、失败路径和测试计划是否站得住？ |
| 写完后审 | `/review` | diff 里有没有 CI 看不出来的生产风险？ |
| 真实环境测 | `/qa` | 用户真的点一遍会不会坏？修复后有没有回归测试？ |
| 发布 | `/ship` | base、测试、review、版本、CHANGELOG、commit、PR 是否齐全？ |

这条主线之外的 Skill 都是"按风险加餐"：有 UI 就加 `/design-review`，有安全面就加 `/cso`，有性能风险就加 `/benchmark`，要合并部署就接 `/land-and-deploy`。

<details>
<summary>展开完整技能地图</summary>

### 产品与计划

| Skill | 它做什么 |
| --- | --- |
| `/office-hours` | 产品入口。用 Startup / Builder 两种模式追问需求，挑战前提，生成设计文档。 |
| `/plan-ceo-review` | CEO / founder 视角审 scope，寻找 10 星产品、砍范围或精选扩展。 |
| `/plan-eng-review` | 工程经理视角审架构、数据流、边界、测试、性能和发布路径。 |
| `/autoplan` | 自动跑 CEO、设计、工程、DX 多轮计划审查，生成完整 reviewed plan。 |
| `/plan-tune` | 调整 gstack 提问敏感度，让某些问题以后少问、总问或自动选择。 |

### 设计与体验

| Skill | 它做什么 |
| --- | --- |
| `/plan-design-review` | 计划阶段的设计审查，检查信息架构、状态覆盖、响应式、AI slop 等。 |
| `/design-consultation` | 从 0 设计产品体验和设计系统，适合需要强设计方向的项目。 |
| `/design-review` | 对真实页面做视觉审计和修复，包含截图、前后对比和原子提交。 |
| `/design-shotgun` | 生成多个设计方向，打开对比板，让你选一个方向继续迭代。 |
| `/design-html` | 生成生产级 HTML / 前端页面，适合把设计方向落成可运行界面。 |
| `/plan-devex-review` | 计划阶段审开发者体验，关注 TTHW、上手路径、文档可信度。 |
| `/devex-review` | 对真实 onboarding 流程做开发者体验审计，测量实际摩擦。 |

### 编码、调试与质量

| Skill | 它做什么 |
| --- | --- |
| `/review` | Staff Engineer 代码审查，找 CI 过不了的生产 bug，能自动修明显问题。 |
| `/investigate` | 系统化调试。先调查再修复，追踪数据流和假设，避免乱试补丁。 |
| `/health` | 代码质量仪表盘，整合类型检查、lint、测试、死代码检测并打分。 |
| `/learn` | 管理 gstack 跨会话学到的项目偏好、模式和经验。 |

### QA、浏览器与数据

| Skill | 它做什么 |
| --- | --- |
| `/qa` | QA Lead。真实浏览器里测试、发现 bug、修复并补回归测试。 |
| `/qa-only` | 只报告不修改代码的 QA，适合你只想要 bug list。 |
| `/browse` | 给 Agent 浏览器眼睛和手，真实 Chromium 点击、截图、取页面状态。 |
| `/setup-browser-cookies` | 从本机浏览器导入 cookies，用于测试登录后的页面。 |
| `/open-gstack-browser` | 打开 GStack Browser，可视化观察 Agent 的浏览器操作。 |
| `/scrape` | 浏览器数据抽取，先原型化抓取网页数据，再可被 skillify 固化。 |
| `/skillify` | 把成功的 `/scrape` 过程变成永久 browser skill，附带脚本、fixture 和测试。 |

### 安全、性能与发布

| Skill | 它做什么 |
| --- | --- |
| `/cso` | Chief Security Officer 安全审计，覆盖 OWASP、STRIDE、依赖、CI/CD、LLM 安全。 |
| `/benchmark` | 性能工程师，基准测试页面加载、Core Web Vitals 和资源体积。 |
| `/ship` | 发布工程师。合并 base、跑测试、审 diff、bump 版本、写 CHANGELOG、提交 PR。 |
| `/land-and-deploy` | 合并 PR、等待 CI 和部署、验证线上健康。 |
| `/canary` | 部署后监控循环，观察 console errors、性能回退和页面失败。 |
| `/setup-deploy` | 一次性配置部署平台、生产 URL 和发布命令，供 land-and-deploy 使用。 |
| `/document-release` | 技术写作，更新 README、文档和发布说明，避免文档落后于代码。 |
| `/retro` | 团队复盘，统计 shipping streak、测试健康、个人贡献和改进机会。 |

### 多 AI、记忆与基础设施

| Skill | 它做什么 |
| --- | --- |
| `/codex` | 调 OpenAI Codex 做第二意见、对抗审查或开放咨询。 |
| `/pair-agent` | 让远程 AI agent 连接你的浏览器会话，适合多代理协作。 |
| `/setup-gbrain` | 配置 gbrain，实现跨机器的会话记忆同步。 |
| `/sync-gbrain` | 刷新 gbrain 对当前 repo 的代码理解，指导 Agent 何时用语义检索。 |
| `/context-save` | 保存当前工作上下文、git 状态、决策和剩余任务。 |
| `/context-restore` | 从保存的上下文恢复工作，跨会话继续。 |
| `/landing-report` | 只读查看发布队列和版本占用，适合多 worktree 并行开发。 |
| `/benchmark-models` | 横向比较 Claude、GPT、Gemini 等模型在 Skill 上的速度、成本和质量。 |

### 安全护栏与实用工具

| Skill | 它做什么 |
| --- | --- |
| `/careful` | 对 destructive 命令加警告，比如 `rm -rf`、force push、hard reset。 |
| `/freeze` | 锁定可编辑目录，防止 Agent 改到边界外文件。 |
| `/guard` | 同时启用 careful 和 freeze，适合生产事故或高风险修改。 |
| `/unfreeze` | 解除 freeze 编辑边界。 |
| `/gstack-upgrade` | 升级 gstack，处理 global / vendored 安装并展示变更。 |
| `/make-pdf` | 把 Markdown 转成高质量 PDF，包含页边距、页码、封面和目录。 |

</details>

:::tip 关键技巧
不用把所有 Skill 都塞进一次工作流。常见闭环是 `/office-hours → /plan-ceo-review → /plan-eng-review → /review → /qa → /ship`。只有遇到对应风险时才加 `/cso`、`/benchmark`、`/design-review` 或 `/land-and-deploy`。
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
