# 用 Symphony 自动巡检运费计算

订单满 100 元包邮，未满 100 元收 8 元。金额以分计，避免货币浮点误差。练习版故意把边界写成了“大于”，让你能观察同一个错误如何变成 GitHub Issue、修复 PR 和绿色的测试结果。

## 1. 先在 Mac 复现

在这个练习目录打开终端，运行：

```sh
node --test test/shipping.test.mjs
```

预期 2 个通过、1 个失败。失败项是“恰好 100 元免运费”，实际 800 分，预期 0 分。把这个失败版本作为首次提交，后面由 Codex 来修。

## 2. 在 GitHub 创建练习仓库

1. 点击 GitHub 右上角 **+ → New repository**。例如取名 `symphony-bug-lab`，公开或私有均可，保留默认启用的 Issues。首次使用可以只授权这个练习仓库。
2. 创建一个**空仓库**：创建页的 README、.gitignore、license 均留空。本地已经有示例文件。
3. 在本机练习目录发布。把 `git remote add origin` 那一行的仓库地址换成自己的。GitHub CLI 如已登录且有上传 workflow 的权限，可跳过登录。

```sh
gh auth login --hostname github.com --git-protocol https --scopes workflow
gh auth setup-git
git init -b main
git add .gitignore .github WORKFLOW.md README.md scripts src test
git commit -m "Add Symphony bug scan exercise"
git remote add origin https://github.com/你的用户名/symphony-bug-lab.git
git push -u origin main
```

以上命令在本练习目录使用一次。`.runtime` 里的程序、工作副本和日志已经忽略。打开 GitHub 仓库，确认默认分支上能看到 `.github/workflows/scan.yml`。

4. 进入 **Issues → Labels → New label**，添加 `symphony`。确认 `bug` 标签也存在（GitHub 新仓库通常自带）。本例根据 `[Scan]` 和 `[Bug]` 标题分派两种工作。
5. **Settings → Actions → General** 应允许 GitHub Actions 及 GitHub 官方的 `actions/*`。如果组织策略禁用了 Actions 或限制写 Issue，需要仓库管理员放行。巡检工作流只请求 Issues 写权限。PR 由本机 Symphony 以你的仓库令牌创建。

## 3. 授权本机 Symphony 访问这个仓库

在 GitHub 头像菜单点 **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**。

选对 **Resource owner**，在 **Repository access → Only select repositories** 里选刚建的练习库。将 **Repository permissions** 中的 **Contents**、**Issues**、**Pull requests** 设为 **Read and write**，分别用于发布修复分支、处理工单、创建 PR。保留自动要求的 Metadata 读权限。生成并复制令牌，稍后粘贴到本机启动脚本的隐藏输入框。

这个令牌由本机服务使用。GitHub Actions 创建巡检单会使用仓库自动提供的令牌，无需往仓库 Secrets 里再填一份。

## 4. 接上 GitHub 并启动服务

在本机练习目录运行下面两行。第一行检查 Codex 登录状态；如果提示未登录，运行一次 `codex login`。第二行里的参数是 GitHub 上的“用户名/仓库名”。

```sh
codex login status
bash scripts/start.sh 你的用户名/symphony-bug-lab
```

粘贴第 3 步的令牌并按回车，打开 <http://127.0.0.1:4078/>。保持 Mac 唤醒、网络连通、终端开启。按 Control+C 停止。终端退出或机器休眠时，GitHub 仍可按计划创建巡检单，服务恢复后会认领积压的单。脚本在当前进程里传递令牌。每张任务卡都在独立代码副本里工作。

本机的空面板预览在 4077 端口，使用独立的内存队列。需要重新启动预览时运行 `bash scripts/start.sh --preview`。真正接 GitHub 任务的是 4078 端口的服务。官方预览版要求明确接受无人值守运行，脚本中包含发行版要求的启动参数。

若换到另一台 Apple Silicon Mac，可从项目根目录用下面几行恢复本机可执行文件，并与官方 SHA-256 核对（需要 Node、git、gh 和已登录的 Codex CLI）。

```sh
mkdir -p .runtime
curl -fL https://github.com/openai/symphony/releases/download/v0.0.3/symphony-v0.0.3-macos_arm64 -o .runtime/symphony
echo 'b85d78b25cd5cacff92424416f6a3af7cafee5d675f56b5cd26d22d601c2026d  .runtime/symphony' | shasum -a 256 -c - && chmod +x .runtime/symphony
```

## 5. 从 GitHub 手动跑第一次

1. 打开仓库 **Actions → Daily bug scan → Run workflow**，选 `main`，再点 **Run workflow**。第一次打开 Actions 如有启用提示，先点启用。
2. 在 **Issues** 找到 `[Scan] 运行运费回归测试`。操作成功的标志是这张单出现；此时 Actions 的绿色勾只代表派单成功。
3. 在本机 4078 面板等 Symphony 接单。Codex 会跑测试，创建或复用一张 `[Bug] 恰好 100 元免运费`，将单号回复到巡检单并关闭巡检单。若没有接单，检查服务是否在运行、仓库参数是否一致、Issue 上有没有 `symphony` 标签；也可以看 `.runtime/logs-4078/`。
4. 在 **Pull requests** 打开修复 PR。**Files changed** 应显示 `src/shipping.mjs` 的包邮门槛修正，**Checks → PR tests / shipping** 应显示 3 个用例通过。创建 PR 后，bug 单移除调度标签，等你审查。
5. 确认后点 **Merge pull request** 并确认合并。PR 正文中的 `Fixes #编号` 会在合入默认分支时关闭对应 bug 单。再次手动触发巡检，预期巡检单报告全部通过，本轮不会产生新的修复单或 PR。

定时配置为每天北京时间 **09:17**（UTC 01:17）。GitHub 在默认分支上运行定时工作流，繁忙时可能延后。即使手动触发多次，尚未处理、仍带调度标签的巡检单也会被复用。日后暂停定时派单，可在 **Actions → Daily bug scan → … → Disable workflow** 操作。

## 看懂两个配置文件

- [scan.yml](.github/workflows/scan.yml) 定义何时派单，并用 GitHub API 创建或复用巡检 Issue。它在 GitHub 的机器上运行。
- [WORKFLOW.md](WORKFLOW.md) 是本机调度器和 Codex 都会读取的文件。顶端的 YAML 指定仓库、标签、并发数和如何准备工作目录。下方的中文说明规定巡检单怎么报错、修复单怎么开 PR、在哪一步交给你审查。
- [pr-tests.yml](.github/workflows/pr-tests.yml) 在 PR 上重新运行原来的测试，给审查人一个独立的结果。

本例的巡检范围是已经写成测试的运费行为。迁移到真实项目时，把 `WORKFLOW.md` 里的复现命令、修复文件范围和 PR 检查改成项目自己的。官方资料见 [Symphony v0.0.3](https://github.com/openai/symphony/tree/v0.0.3/elixir) 和 [GitHub Actions 定时触发](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。
