---
tracker:
  kind: github
  provider:
    repo: $GITHUB_REPO
    token: $GITHUB_TOKEN
  active_states: ["open"]
  terminal_states: ["closed"]
  required_labels: ["symphony"]
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git -c credential.helper= -c 'credential.helper=!gh auth git-credential' clone --depth 1 "https://github.com/${GITHUB_REPO}.git" .
agent:
  max_concurrent_agents: 1
codex:
  command: codex app-server
---

你正在处理 {{ issue.identifier }}，标题为「{{ issue.title }}」。
单号是 {{ issue.id }}，任务描述如下。

{{ issue.description }}

在当前仓库副本执行测试。通过提供的 github_api 工具读写当前仓库的 Issue、分支及 PR。
仓库名从 git remote get-url origin 读取。GitHub 的默认分支从仓库 API 的 default_branch 读取。

## 巡检单（标题以 [Scan] 开头）

1. 运行 `node --test test/shipping.test.mjs`。若全部通过，评论「三个运费用例全部通过」并关闭巡检单。
2. 如果是断言失败，在所有打开的 Issue 中查找相同用例的 bug 单，含已提 PR 正在等审查的单。
   用稳定标题 `[Bug] <失败用例名称>` 查重。已有单就引用它，否则创建带 `bug` 和 `symphony`
   标签的 Issue，写明复现命令、实际值、预期值和当前提交号。每个失败用例各建一单。
3. 把关联的 bug 单号评论回巡检单，然后关闭巡检单。巡检阶段保留失败现场，由修复单改代码。
   若命令因缺少 Node 等环境原因无法运行，评论具体错误并移除本单的 symphony 标签，交给人处理。

## 修复单（标题以 [Bug] 开头）

1. 查找本仓库分支 `symphony/fix-{{ issue.id }}` 已有的开放 PR。若已有，直接完成第 4 步。
   否则运行复现命令。如果当前默认分支已经通过，评论结果并关闭已失效的 bug 单。
2. 按现有测试修复 `src/shipping.mjs`，运行同一个测试文件，确认全部通过。保留原测试和验收条件。
3. 通过 github_api 将修复发布到单独的分支。用本地 `git rev-parse HEAD` 取得已测试的基线，
   用 GitHub 的 git/refs 接口创建或复用上述分支。通过 Contents API 读取该分支上
   `src/shipping.mjs` 的 blob SHA，再 PUT 已测试文件的 Base64 内容到该分支。若分支上
   已经是相同内容，复用已有提交。创建指向默认分支的 PR，正文含 `Fixes #{{ issue.id }}`
   和测试结果。把合并操作留给仓库主人。
4. 在 bug 单上留下 PR 链接（已有相同链接可复用），最后移除 bug 单的 symphony 标签。
   保持 bug 单打开，供维护者审查 PR，合入默认分支时由 GitHub 关闭。

遇到写入权限或其他阻碍时，尽可能在工单上记录错误并移除调度标签，便于人处理。
其他标题的单不执行上述操作，说明原因并移除调度标签。
