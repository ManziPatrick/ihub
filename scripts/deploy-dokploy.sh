#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Dokploy Redeploy Helper
#  Lists applications and triggers redeploys on your self-hosted Dokploy.
#
#  Setup (one-time):
#    1. Log into https://server.bootskills.com  →  Profile Settings  →  API Keys
#    2. Create a token, then copy this file to scripts/.env.dokploy:
#         DOKPLOY_URL=https://server.bootskills.com
#         DOKPLOY_API_KEY=your-token-here
#         DOKPLOY_APP_IDS=appid1,appid2        # optional — comma separated
#
#  Usage:
#    scripts/deploy-dokploy.sh list                    # show apps + IDs (+ build type)
#    scripts/deploy-dokploy.sh deploy                  # redeploy ALL configured apps
#    scripts/deploy-dokploy.sh deploy <appId>          # redeploy one app
#    scripts/deploy-dokploy.sh set-dockerfile <appId> [redeploy]
#                                                      # switch app to Dockerfile build (fixes slow Nixpacks)
#    scripts/deploy-dokploy.sh health                  # smoke-test api.bootskills.com
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${DOKPLOY_ENV_FILE:-$SCRIPT_DIR/.env.dokploy}"

# Load config from env file if present (real env vars take precedence)
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

DOKPLOY_URL="${DOKPLOY_URL:-https://server.bootskills.com}"
API_KEY="${DOKPLOY_API_KEY:-}"
APP_IDS="${DOKPLOY_APP_IDS:-}"

require_key() {
  if [ -z "$API_KEY" ]; then
    echo "❌ DOKPLOY_API_KEY is not set." >&2
    echo "   Create a token at https://server.bootskills.com → Profile → API Keys" >&2
    echo "   Then run:  cp scripts/.env.dokploy.example scripts/.env.dokploy  and fill it in" >&2
    exit 1
  fi
}

curl_json() {
  # $1 = method, $2 = path, $3 = optional JSON body
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS --max-time 60 -X "$method" \
      -H "accept: application/json" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$body" \
      "${DOKPLOY_URL}${path}"
  else
    curl -sS --max-time 60 -X "$method" \
      -H "accept: application/json" \
      -H "x-api-key: $API_KEY" \
      "${DOKPLOY_URL}${path}"
  fi
}

has_jq() { command -v jq >/dev/null 2>&1; }

check_response() {
  # $1 = raw response. Detects auth/API errors so failures are obvious.
  local resp="$1"
  if echo "$resp" | grep -qiE '"message"[[:space:]]*:[[:space:]]*"unauthorized"|"message"[[:space:]]*:[[:space:]]*"forbidden"|access denied'; then
    echo "❌ Dokploy rejected the request (check DOKPLOY_API_KEY in $ENV_FILE)." >&2
    echo "   Response: $(echo "$resp" | head -c 200)" >&2
    exit 1
  fi
}

cmd_list() {
  require_key
  echo "📦 Fetching projects from $DOKPLOY_URL ..."
  local data
  data="$(curl_json GET /api/project.all)"
  if [ -z "$data" ] || [ "$data" = "[]" ]; then
    echo "⚠️  No projects found (or the API response was empty)."
    echo "   Raw response: $data"
    exit 1
  fi
  check_response "$data"
  if has_jq; then
    echo "───────────────────────────────────────────────────────────────────"
    printf "%-28s %-8s %s\n" "APPLICATION ID" "STATUS" "NAME"
    echo "───────────────────────────────────────────────────────────────────"
    echo "$data" | jq -r '.[] | . as $p | (.applications // [])[] | "\(.applicationId)\t\(.applicationStatus // "?")  \(.buildType // "?")\t\(.name // "?")  [project: \($p.name)]"'
  else
    echo "ℹ️  jq not installed — showing IDs/names from raw response:"
    echo "$data" | grep -oE '"applicationId":"[^"]+"' | sort -u
    echo "$data" | grep -oE '"name":"[^"]+"' | sort -u
  fi
}

cmd_deploy() {
  require_key
  local app_id="${1:-}"
  local ids=()
  if [ -n "$app_id" ]; then
    ids=("$app_id")
  elif [ -n "$APP_IDS" ]; then
    IFS=',' read -ra ids <<< "$APP_IDS"
  else
    echo "❌ No app selected. Pass an appId or set DOKPLOY_APP_IDS (see scripts/.env.dokploy.example)." >&2
    echo "   Tip: run  scripts/deploy-dokploy.sh list  to find app IDs." >&2
    exit 1
  fi

  for id in "${ids[@]}"; do
    id="$(echo "$id" | tr -d ' ')"
    [ -z "$id" ] && continue
    echo "🚀 Deploying application $id ..."
    local resp
    resp="$(curl_json POST /api/application.deploy "{\"applicationId\":\"$id\"}")"
    check_response "$resp"
    echo "$resp" | head -c 500
    echo
  done
}

cmd_set_dockerfile() {
  require_key
  local app_id="${1:-}"
  local do_redeploy="${2:-}"
  if [ -z "$app_id" ]; then
    echo "❌ Usage: $0 set-dockerfile <appId> [redeploy]" >&2
    exit 1
  fi
  echo "🔧 Switching application $app_id to Dockerfile build ..."
  local resp
  resp="$(curl_json POST /api/application.update "{\"applicationId\":\"$app_id\",\"buildType\":\"dockerfile\",\"dockerfile\":\"Dockerfile\"}")"
  check_response "$resp"
  echo "$resp" | head -c 300
  echo
  if echo "$resp" | grep -qiE 'true|success'; then
    echo "✅ Build type set to Dockerfile (root dir must be \"frontend\" so it uses frontend/Dockerfile)."
    if [ "$do_redeploy" = "redeploy" ]; then
      echo
      cmd_deploy "$app_id"
    else
      echo "   Next: redeploy with  scripts/deploy-dokploy.sh deploy $app_id"
    fi
  else
    echo "⚠️  Response did not confirm success — check the output above." >&2
  fi
}

cmd_health() {
  echo "🔎 Checking https://api.bootskills.com/health ..."
  curl -sS --max-time 20 https://api.bootskills.com/health | head -c 600
  echo
}

case "${1:-}" in
  list)            cmd_list ;;
  deploy)          cmd_deploy "${2:-}" ;;
  set-dockerfile)  cmd_set_dockerfile "${2:-}" "${3:-}" ;;
  health)          cmd_health ;;
  *)
    echo "Usage: $0 {list|deploy [appId]|set-dockerfile <appId> [redeploy]|health}" >&2
    exit 1
    ;;
esac
