#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
root="$PWD"
runtime="$root/.runtime"
binary="$runtime/symphony"
mkdir -p "$runtime"

if [[ ! -x "$binary" ]]; then
  echo "缺少可执行文件，请按 README 的安装说明准备 .runtime/symphony。" >&2
  exit 1
fi

case "${1:-}" in
  --preview)
    # 使用内存中的空队列，只查看本机面板。此模式不连接 GitHub。
    workflow="$runtime/preview.md"
    cat > "$workflow" <<'PREVIEW'
---
tracker:
  kind: memory
  active_states: ["open"]
  terminal_states: ["closed"]
---
本地空队列，用于预览面板。
PREVIEW
    port=4077
    ;;
  */*)
    export GITHUB_REPO="$1"
    if [[ ! "$GITHUB_REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
      echo "仓库名格式应为 用户名/仓库名。" >&2
      exit 2
    fi
    if [[ -z "${GITHUB_TOKEN:-}" ]]; then
      read -r -s -p "粘贴这个仓库的 GitHub 令牌，然后按回车：" GITHUB_TOKEN
      echo
    fi
    : "${GITHUB_TOKEN:?需要有效的 GitHub 令牌}"
    export GITHUB_TOKEN
    export SYMPHONY_WORKSPACE_ROOT="$runtime/workspaces/$GITHUB_REPO"
    workflow="$root/WORKFLOW.md"
    port=4078
    ;;
  *)
    echo "用法：bash scripts/start.sh --preview 或 bash scripts/start.sh 用户名/仓库名" >&2
    exit 2
    ;;
esac

echo "本机面板 http://127.0.0.1:$port/"
exec "$binary" --i-understand-that-this-will-be-running-without-the-usual-guardrails \
  --logs-root "$runtime/logs-$port" --port "$port" "$workflow"
