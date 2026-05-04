---
outline: deep
---

# 第 6 章 · /ship 深度拆解

> 发布流程的自动化设计——每一步为什么存在，每一步为什么这样设计

[[toc]]

## 设计概览

/ship 是 gstack 里最像"生产流水线"的 Skill。用户说 `/ship`，它不再进入讨论模式，而是把代码从当前分支推进到 PR：合并 base、跑测试、做发布前审查、补版本、写 CHANGELOG、拆 commit、push、创建或更新 PR。

它的设计目标不是"帮你省几条 git 命令"，而是把发布中最容易被 AI 偷懒跳过的门禁固定下来。

```mermaid
flowchart TD
    A[/ship] --> B[Step 0: 平台和 base branch]
    B --> C[Pre-flight + review dashboard]
    C --> D[Distribution pipeline check]
    D --> E[Merge base before tests]
    E --> F[Test framework bootstrap + tests]
    F --> G[Coverage / plan / review gates]
    G --> H[VERSION + CHANGELOG]
    H --> I[Bisectable commits]
    I --> J[Fresh verification]
    J --> K[Push]
    K --> L[Documentation sync]
    L --> M[Create or update PR]
```

/ship 有一个非常鲜明的产品判断：发布应该自动化，但不能鲁莽。它会自动处理无争议事项，比如 CHANGELOG、PATCH/MICRO 版本、commit message、已完成 TODO；但遇到需要人类判断的风险，比如复杂冲突、重大版本、ASK findings、低覆盖率，就会停下来。

## 源码精读

下面的源码引用都来自 [gstack/ship/SKILL.md](https://github.com/garrytan/gstack/blob/main/ship/SKILL.md)。

### 发布入口：用户说 ready 时不要直接 push

```yaml
name: ship
description: |
  Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION,
  update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy",
  "push to main", "create a PR", "merge and push", or "get it deployed".
  Proactively invoke this skill (do NOT push/PR directly) when the user says code
  is ready...
```

为什么这样设计：description 明确禁止"直接 push/PR"的捷径。只要用户表达发布意图，就应该进入完整门禁，而不是让 Agent 选几步看起来方便的命令。

这段描述实际上把 `/ship` 变成发布入口路由。它覆盖用户的自然语言说法，并且写明 "do NOT push/PR directly"。这很重要，因为发布不是一个 git 操作，而是一组证据链：base 是否最新、测试是否新鲜、review 是否通过、版本和 changelog 是否一致。

### 目标检测：先确定平台和 base branch

````markdown
## Step 0: Detect platform and base branch

First, detect the git hosting platform from the remote URL:

```bash
git remote get-url origin 2>/dev/null
```

Determine which branch this PR/MR targets, or the repo's default branch if no PR/MR exists. Use the result as "the base branch" in all subsequent steps.
````

为什么这样设计：发布流程里最危险的隐式假设之一是"base 就是 main"。先检测平台和 base，可以避免 diff、测试、merge、PR 全部对错目标分支运行。

这段源码把"目标分支"提升成全局变量。后续 diff、log、fetch、merge、PR creation 都必须引用同一个 base。否则你可能对 main 生成 changelog，却向 develop 开 PR；或者测试了错误的 merge base。

### 自动化边界：只在高风险决策前停下

```markdown
You are running the `/ship` workflow. This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- In-branch test failures
- Pre-landing review finds ASK items that need user judgment
- MINOR or MAJOR version bump needed
```

为什么这样设计：发布 Skill 如果每一步都问，会变成人肉确认机；如果一步都不问，又会掩盖高风险决策。gstack 把"什么时候停"写成白名单，让自动化既顺滑又有边界。

这里的关键词是 **Only stop for**。它不是列 checklist，而是在定义自动化授权范围。用户说 `/ship` 已经授权了普通发布动作；但没有授权重大的语义变更，比如大版本升级、复杂冲突解决或需要产品判断的 review finding。

### 幂等设计：动作可复用，证据必须新鲜

```markdown
Re-running `/ship` means "run the whole checklist again." Every verification step
(tests, coverage audit, plan completion, pre-landing review, adversarial review,
VERSION/CHANGELOG check, TODOS, document-release) runs on every invocation.
Only *actions* are idempotent.
```

为什么这样设计：缓存旧验证是发布事故温床。gstack 区分"动作可以幂等"和"证据必须新鲜"：PR 已存在可以更新，push 已完成可以跳过，但测试和 review 证据必须重新生成。

这是一条非常值得迁移的自动化原则。创建 PR、push branch、写 changelog 这些是状态动作，可以检测已有状态并避免重复；测试、审查、覆盖率这些是证据，证据会随着代码、base、依赖和环境变化而过期。

### 合并后验证：测试必须跑在真实发布状态上

````markdown
## Step 3: Merge the base branch (BEFORE tests)

Fetch and merge the base branch into the feature branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```
````

为什么这样设计：在旧 base 上通过的测试没有发布意义。先合并 base 再测试，可以让验证结果接近真正合并后的状态，减少"本地绿、合并红"。

这段把发布验证从"我的分支没坏"变成"我的分支和目标分支合在一起没坏"。对多人并行开发尤其重要，因为 base branch 可能已经改变了 API、schema、依赖或测试环境。

### 提交结构：为什么 commit 要可二分

```markdown
### Step 15.1: Bisectable Commits

**Goal:** Create small, logical commits that work well with `git bisect` and help LLMs understand what changed.

Each commit should represent **one coherent change** — not one file, but one logical unit.
```

为什么这样设计：AI 很容易把所有改动塞进一个大 commit。gstack 要求按逻辑拆分，是为了让回滚、审查、`git bisect` 和后续 Agent 理解都更可靠。

这里的"逻辑单元"比"按文件提交"更高级。一个 model 和它的测试应该在同一个 commit；一个 migration 可能需要独立 commit；VERSION 和 CHANGELOG 通常属于最后的发布元数据 commit。这样每个 commit 都更接近可独立理解、可回滚、可定位问题的单位。

## 设计决策

**决策 1：/ship 是聊天式确认，还是非交互流水线？**

gstack 选择非交互流水线。用户已经说"ship"，说明意图明确。继续问"要不要 push"、"要不要创建 PR"只会浪费注意力。真正需要问的，是那些会改变风险或发布语义的问题。

**决策 2：测试前 merge base，还是先跑当前分支测试？**

gstack 选择先 merge base。当前分支测试只能说明"在旧世界里没坏"，发布测试必须说明"在即将合并的世界里没坏"。

**决策 3：每次重跑复用旧结果，还是重新生成验证证据？**

gstack 选择重新验证。旧 PR、旧 push 可以复用，因为它们是状态；旧测试结果不能复用，因为代码、base branch、依赖、环境都可能变了。

**决策 4：一个大 commit，还是 bisectable commits？**

gstack 选择 bisectable commits。对小 diff 来说，一个 commit 可以；对多主题 diff，按逻辑拆分能显著降低 review 和回滚成本。

**决策 5：文档同步在 PR 后做，还是 PR 前做？**

gstack 选择 push 后、PR 前用 document-release subagent 同步。这样 PR body 一开始就包含文档状态，不需要先创建 PR 再补补丁，也避免主流程上下文已经很长时继续硬塞文档判断。

## 你可以这样用

设计发布类 Skill 时，可以复用 /ship 的结构：

```markdown
## Step 0: Detect target
Detect platform, base branch, environment, and deployment target. Never assume.

## Step 1: Pre-flight
Check branch, working tree, diff, prior review status.

## Step 2: Synchronize
Fetch and merge/rebase target base before verification.

## Step 3: Verify
Run tests, coverage, review, plan completion, security or design gates.

## Step 4: Package
Bump version, changelog, release notes, docs.

## Step 5: Commit and publish
Create logical commits, push, create or update release artifact.

## Step 6: Persist metrics
Write machine-readable logs for future runs.
```

更好的提问方式不是"帮我发布"，而是：

> "帮我设计一个发布 Skill：哪些步骤必须自动化，哪些风险必须停下来问人？"

这个问题会逼你定义自动化边界。/ship 的价值就在这里：它不是盲目自动，而是知道哪些决策已经被用户授权，哪些还没有。

这一章的小细节：/ship 把 "Only actions are idempotent, verification is always fresh" 作为隐含哲学。这个原则可以迁移到任何自动化流程：状态可以复用，证据要重取。
