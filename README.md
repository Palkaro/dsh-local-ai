<div align="center">

# 🤖 dsh-local-ai

**Local-model (Ollama) integration for DeepSeek Harness.**

*Discover, pull, remove, and inspect local models, route requests to them by task type or keyword with automatic fallback to the cloud, and get a one-shot status overview via `/ollama`.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-local-ai/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-local-ai/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-local-ai?label=version)](https://github.com/PerryLink/dsh-local-ai/releases)
[![npm version](https://img.shields.io/npm/v/dsh-local-ai)](https://www.npmjs.com/package/dsh-local-ai)
[![npm downloads](https://img.shields.io/npm/dm/dsh-local-ai)](https://www.npmjs.com/package/dsh-local-ai)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Backend | [Ollama](https://ollama.com) (local HTTP API + CLI probe) |
| Model | Text-only route (`inputModalities: ['text']`); tool calls and tool results are supported |

## What you get

`dsh-local-ai` makes Ollama a first-class local provider in DeepSeek Harness:

- **Discovery & management** — `ollama_list` (installed models, running models, disk usage), `ollama_show` (parameter size, quantization, context length), `ollama_pull`, and `ollama_remove`.
- **Health check** — process liveness (via the `ollama` CLI) and API responsiveness (via `/api/version`), reported as two independent signals.
- **Official adapter** — the `ollama` provider route is registered through `ctx.llm.registerAdapter` (`LlmAdapter`), with configurable model mapping and temperature / max-tokens / stop translation.
- **Local routing** — `model_route` rules route requests to a local model by task type (`purpose`), case-insensitive keyword, or `always`, with automatic fallback to the cloud when the local route fails before producing content.
- **`/ollama` command** — a one-shot status overview: models, disk usage, health, and suggestions.
- **Zero dependencies, HTTP first** — everything talks to Ollama's HTTP API (the CLI is used only for the process probe); no model files are bundled.

```text
request (loop)
   │ llm/stream waterfall
   ├─ rule matches? ──▶ route to ollama ──▶ Ollama /api/chat (NDJSON stream)
   │                        └─ fails first ─▶ fall back to cloud (next())
   └─ no match ──▶ cloud provider
tools ──▶ /api/tags · /api/ps · /api/show · /api/pull · /api/delete
health ──▶ /api/version (API) + ollama list (process)
```

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-local-ai#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-local-ai

# 2. configure routing in your profile patch (cordis.yml) and restart
dsh --profile web
```

Minimal routing configuration (the rule ships commented out in `cordis.patch.yml`):

```yaml
- insert:
    - id: dsh-local-ai
      name: dsh-local-ai
      config:
        route:
          - model: llama3.2
            keywords: ["confidential", "offline"]
```

Then verify the row mounts:

```sh
dsh --profile web --dump-config | grep -A2 'id: dsh-local-ai'
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-local-ai#main"` — the `prepare` script builds with production dependencies only.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-local-ai`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-local-ai-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-local-ai` (or remove the row from the profile patch).

> If pnpm reports `ERR_PNPM_IGNORED_BUILDS` for this package, add `allowBuilds: { esbuild: true }` to your `pnpm-workspace.yaml` — the `dsh` CLI prints the exact snippet.

## Configuration

All tunables are Schemastery `Config` fields (changeable from cordis.yml). An id-targeted override replaces the whole row — restate every key you need. `cordis.patch.yml` documents each key inline.

| Key | Default | Meaning |
|---|---|---|
| `baseURL` | `http://127.0.0.1:11434` | Ollama HTTP API base URL; `/api/*` paths are appended |
| `requestTimeoutMs` | `30000` | Per-request HTTP timeout (milliseconds) |
| `graceMs` | `15000` | Subprocess terminate grace for the health-check CLI probe |
| `defaultContextWindow` | `8192` | Context capacity used when a model has no exact value |
| `maxTokens` | `4096` | Per-request output cap used when a model has no exact value |
| `temperature` | *(none)* | Default sampling temperature (0..2); omitted leaves the provider default |
| `models` | `[]` | Harness-visible → Ollama model mappings |
| `models[].name` | *(required)* | Harness-visible model name (`GenerateOptions.model`) |
| `models[].model` | `= name` | Ollama model id |
| `models[].contextWindow` | *(none)* | Per-model context capacity |
| `models[].maxTokens` | *(none)* | Per-model output cap |
| `models[].temperature` | *(none)* | Per-model sampling temperature |
| `route` | `[]` | Local-model routing rules (first match wins) |
| `route[].model` | *(required)* | Target local model name |
| `route[].purpose` | *(none)* | Task type match: `compaction` / `session-title` |
| `route[].keywords` | `[]` | Case-insensitive request keywords |
| `route[].always` | `false` | Route every eligible request to this model |

## Tools & surfaces

| Surface | Kind | What it does |
|---|---|---|
| `ollama_list` | tool | List installed models, running models, and disk usage |
| `ollama_show` | tool | Show parameter size, quantization, context length, family, format |
| `ollama_pull` | tool | Pull (download) a model |
| `ollama_remove` | tool | Remove a model |
| `ollama_health` | tool | Process liveness + API responsiveness |
| `/ollama` | command | One-shot status overview (models + health + suggestions) |

**Consumes** the public host services `ctx.llm` (`registerAdapter`), `ctx.tools`, `ctx.subprocess` (CLI probe), and `ctx.commands`. It registers no `llm/stream` short-circuit by default — the routing listener passes through (`next()`) unless a rule matches.

## Permissions & data

- **Permissions**: `network:outbound` to the Ollama endpoint you configure; no native code, no filesystem access, no storage.
- **Data**: every model list/detail, health fact, and error message shown to the model or the user is sanitized (endpoint userinfo and secret query params dropped, control characters stripped, lengths bounded) before display. Tool and command results are logged by the harness's own tool/command seams.
- **Credentials**: the plugin stores and reads no credentials. It only issues HTTP requests to the endpoint you configure, plus the local `ollama list` process probe.

## Security boundaries

- **No re-routing by default** — the `route` list is empty unless you opt in; a request reaches a local model only through an explicit rule or an explicit `ollama` provider selection.
- **Sanitize before display** — endpoint addresses and local paths are sanitized before they reach tool output, the `/ollama` command, or error messages.
- **Zero bundled models** — downloads and storage are Ollama's own responsibility; nothing is shipped in the package.
- **Failure loud, failure contained** — invalid config fails the mount; a local route that fails before producing content falls back to the cloud (`next()`), so a down Ollama never bricks a conversation.
- **Model-visible ⟺ logged** — routing only changes which provider serves a request (the assistant message is logged with its `ollama` provenance); no new model-visible input is invented.

## Known limitations

- **rc.6 only** — developed and tested against `@deepseek-ai/dsh@0.1.0-rc.6`; newer harness baselines are expected to work but are verified by the monthly compat workflow.
- **Text-only route** — image content is rejected (`UNSUPPORTED_CONTENT`); multimodal local models are not wired up yet.
- **Mid-stream fallback** — once a local route has started producing content, a later failure is forwarded (not retracted); only a failure before the first token falls back to the cloud.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests against the published 0.1.0-rc.6 types
pnpm run typecheck:ci  # strict tsc against published rc.6 types (skipLibCheck off)
pnpm test           # vitest: real Context/LlmRuntime/ToolRuntime/CommandRuntime/subprocess seams
pnpm run test:coverage  # coverage gate (90/80/90/90)
pnpm run build      # tsdown bundle + tsc declarations (lib/)
pnpm run verify:self-contained  # dependency specs resolve from the registry
pnpm run verify:artifacts       # built ESM face + bundle patch present
node scripts/check-readme-sync.mjs  # five-language README sync gate
pnpm pack           # the published tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `ollama`, `local-llm`, `local-models`, `offline`, `privacy`, `model-routing`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: adapter, routing, tools, health check, sanitization, and the five-language docs.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-local-ai contributors
