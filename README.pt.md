<div align="center">

# 🤖 dsh-local-ai

**Integração de modelos locais (Ollama) para o DeepSeek Harness.**

*Descubra, baixe, remova e inspecione modelos locais, roteie solicitações para eles por tipo de tarefa ou palavra-chave com fallback automático para a nuvem e obtenha um resumo de status de relance com `/ollama`.*

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

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Backend | [Ollama](https://ollama.com) (API HTTP local + sonda CLI) |
| Modelo | Rota somente texto (`inputModalities: ['text']`); chamadas e resultados de ferramentas são suportados |

## What you get

O `dsh-local-ai` torna o Ollama um provedor local de primeira classe no DeepSeek Harness:

- **Descoberta e gestão** — `ollama_list` (modelos instalados, em execução, uso de disco), `ollama_show` (tamanho de parâmetros, quantização, comprimento de contexto), `ollama_pull` e `ollama_remove`.
- **Verificação de saúde** — vitalidade do processo (via CLI `ollama`) e resposta da API (via `/api/version`), como dois sinais independentes.
- **Adaptador oficial** — a rota do provedor `ollama` é registrada por `ctx.llm.registerAdapter` (`LlmAdapter`), com mapeamento de modelos configurável e tradução de temperature / max-tokens / stop.
- **Roteamento local** — regras `model_route` roteiam solicitações para um modelo local por tipo de tarefa (`purpose`), palavra-chave (sem diferenciar maiúsculas) ou `always`, com fallback automático para a nuvem quando a rota local falha antes de produzir conteúdo.
- **Comando `/ollama`** — resumo de status de relance: modelos, uso de disco, saúde e sugestões.
- **Zero dependências, HTTP primeiro** — tudo fala com a API HTTP do Ollama (a CLI só é usada para a sonda de processo); nenhum arquivo de modelo é empacotado.

```text
request (loop)
   │ cascata llm/stream
   ├─ regra corresponde? ──▶ rotear para ollama ──▶ Ollama /api/chat (fluxo NDJSON)
   │                        └─ falha primeiro ─▶ fallback para nuvem (next())
   └─ sem correspondência ──▶ provedor na nuvem
tools ──▶ /api/tags · /api/ps · /api/show · /api/pull · /api/delete
health ──▶ /api/version (API) + ollama list (processo)
```

## Quick start

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-local-ai#main"

# ou do npm (versões publicadas)
dsh plugin --profile web add dsh-local-ai

# 2. configure o roteamento no seu patch de perfil (cordis.yml) e reinicie
dsh --profile web
```

Configuração mínima de roteamento (a regra vem comentada em `cordis.patch.yml`):

```yaml
- insert:
    - id: dsh-local-ai
      name: dsh-local-ai
      config:
        route:
          - model: llama3.2
            keywords: ["confidential", "offline"]
```

Depois verifique se a linha monta:

```sh
dsh --profile web --dump-config | grep -A2 'id: dsh-local-ai'
```

## Install & uninstall

- **canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-local-ai#main"` — o script `prepare` compila apenas com dependências de produção.
- **canal npm** (versões publicadas): `dsh plugin --profile web add dsh-local-ai`.
- **canal tarball**: `pnpm pack` neste repo e depois `dsh plugin --profile web add ./dsh-local-ai-<version>.tgz`.
- **desinstalar**: `dsh plugin --profile web remove dsh-local-ai` (ou remova a linha do patch do perfil).

> Se o pnpm relatar `ERR_PNPM_IGNORED_BUILDS` para este pacote, adicione `allowBuilds: { esbuild: true }` ao seu `pnpm-workspace.yaml` — a CLI `dsh` imprime o trecho exato.

## Configuration

Todos os ajustes são campos `Config` de Schemastery (modificáveis pelo cordis.yml). Uma sobrescrita por id substitui a linha inteira — repita cada chave de que precisa. O `cordis.patch.yml` documenta cada chave em linha.

| Key | Default | Meaning |
|---|---|---|
| `baseURL` | `http://127.0.0.1:11434` | URL base da API HTTP do Ollama; caminhos `/api/*` são anexados |
| `requestTimeoutMs` | `30000` | Tempo limite HTTP por solicitação (milissegundos) |
| `graceMs` | `15000` | Graça de término do subprocesso para a sonda CLI de saúde |
| `defaultContextWindow` | `8192` | Capacidade de contexto quando um modelo não tem valor exato |
| `maxTokens` | `4096` | Limite de saída por solicitação quando um modelo não tem valor exato |
| `temperature` | *(none)* | Temperatura de amostragem padrão (0..2); omitir mantém o padrão do provedor |
| `models` | `[]` | Mapeamentos nome visível → modelo Ollama |
| `models[].name` | *(required)* | Nome de modelo visível no harness (`GenerateOptions.model`) |
| `models[].model` | `= name` | Id do modelo Ollama |
| `models[].contextWindow` | *(none)* | Capacidade de contexto por modelo |
| `models[].maxTokens` | *(none)* | Limite de saída por modelo |
| `models[].temperature` | *(none)* | Temperatura de amostragem por modelo |
| `route` | `[]` | Regras de roteamento para modelos locais (primeira correspondência vence) |
| `route[].model` | *(required)* | Nome do modelo local de destino |
| `route[].purpose` | *(none)* | Correspondência de tipo de tarefa: `compaction` / `session-title` |
| `route[].keywords` | `[]` | Palavras-chave da solicitação (sem diferenciar maiúsculas) |
| `route[].always` | `false` | Roteia toda solicitação elegível para este modelo |

## Tools & surfaces

| Superfície | Tipo | O que faz |
|---|---|---|
| `ollama_list` | ferramenta | Lista modelos instalados, em execução e uso de disco |
| `ollama_show` | ferramenta | Mostra tamanho de parâmetros, quantização, comprimento de contexto, família, formato |
| `ollama_pull` | ferramenta | Baixa um modelo |
| `ollama_remove` | ferramenta | Remove um modelo |
| `ollama_health` | ferramenta | Vitalidade do processo + resposta da API |
| `/ollama` | comando | Resumo de status de relance (modelos + saúde + sugestões) |

**Consome** os serviços host públicos `ctx.llm` (`registerAdapter`), `ctx.tools`, `ctx.subprocess` (sonda CLI) e `ctx.commands`. Não curto-circuita `llm/stream` por padrão — o ouvinte de roteamento repassa (`next()`) salvo quando uma regra corresponde.

## Permissions & data

- **Permissões**: `network:outbound` para o endpoint Ollama que você configurar; sem código nativo, sem acesso ao sistema de arquivos, sem armazenamento.
- **Dados**: toda lista/detalhe de modelo, fato de saúde e mensagem de erro exibidos ao modelo ou ao usuário são sanitizados (userinfo e parâmetros de consulta secretos do endpoint removidos, caracteres de controle removidos, comprimentos limitados) antes da exibição. Resultados de ferramentas e comandos são registrados pelos mecanismos próprios do harness.
- **Credenciais**: o plugin não armazena nem lê credenciais. Ele apenas emite solicitações HTTP ao endpoint que você configurar, além da sonda de processo local `ollama list`.

## Security boundaries

- **Sem re-roteamento por padrão** — a lista `route` fica vazia salvo se você optar; uma solicitação chega a um modelo local apenas por uma regra explícita ou seleção explícita do provedor `ollama`.
- **Sanitização antes de exibir** — endereços de endpoint e caminhos locais são sanitizados antes de chegar à saída de ferramentas, ao comando `/ollama` ou a mensagens de erro.
- **Zero modelos empacotados** — downloads e armazenamento são responsabilidade do Ollama; nada é enviado no pacote.
- **Falha alta, falha contida** — configuração inválida faz o montagem falhar; uma rota local que falha antes de produzir conteúdo faz fallback para a nuvem (`next()`), de modo que um Ollama caído nunca trava uma conversa.
- **Visível ao modelo ⟺ registrado** — o roteamento só muda qual provedor atende uma solicitação (a mensagem do assistente é registrada com sua proveniência `ollama`); nenhuma entrada visível nova é inventada.

## Known limitations

- **Somente rc.6** — desenvolvido e testado contra `@deepseek-ai/dsh@0.1.0-rc.6`; espera-se que baselines mais novos funcionem, mas são verificados pelo workflow mensal de compat.
- **Rota somente texto** — conteúdo de imagem é rejeitado (`UNSUPPORTED_CONTENT`); modelos locais multimodais ainda não estão conectados.
- **Fallback no meio do fluxo** — uma vez que uma rota local começou a produzir conteúdo, uma falha posterior é reencaminhada (não retirada); apenas uma falha antes do primeiro token faz fallback para a nuvem.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + testes contra os tipos publicados 0.1.0-rc.6
pnpm run typecheck:ci  # tsc estrito contra os tipos publicados rc.6 (skipLibCheck off)
pnpm test           # vitest: costuras reais Context/LlmRuntime/ToolRuntime/CommandRuntime/subprocess
pnpm run test:coverage  # porta de cobertura (90/80/90/90)
pnpm run build      # bundle tsdown + declarações tsc (lib/)
pnpm run verify:self-contained  # especificações de dependências resolvem do registry
pnpm run verify:artifacts       # face ESM construída + bundle patch presentes
node scripts/check-readme-sync.mjs  # porta de sincronização de README em cinco idiomas
pnpm pack           # o tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `ollama`, `local-llm`, `local-models`, `offline`, `privacy`, `model-routing`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: adaptador, roteamento, ferramentas, verificação de saúde, sanitização e documentação em cinco idiomas.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-local-ai contributors
