# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub's private vulnerability reporting:

**https://github.com/PerryLink/dsh-local-ai/security/advisories/new**

That flow keeps the report confidential while we triage, and it is the channel we watch first.

## Before you report

- **Redact sensitive data** from any logs, session excerpts, or request bodies you attach: tokens, API keys, secrets, Authorization/request headers, personal paths, and account identifiers. Trimmed stack traces and redacted payload samples are usually enough.
- Include, when possible: the plugin version, the harness (`dsh`) version, Node and OS versions, your Ollama version, and the minimal steps to reproduce.

## What to expect

- **Acknowledgment**: within 5 business days.
- **Triage**: within 10 business days we confirm the issue and assess severity, or ask for more details.
- **Fix**: security fixes are prepared in a private fork, released as a patch version, and announced in the release notes.

## Disclosure and credit

- We follow coordinated disclosure: a public advisory (and CVE request where appropriate) is published once a fix ships.
- Reporters are credited in the advisory unless they ask to remain anonymous. There is no bug bounty program at this time.

## Scope

This plugin talks to the Ollama server **you** configure, over its HTTP API and (for process liveness) its CLI. Its own guarantees are:

- **No re-routing by default** — the `route` list is empty unless you opt in; requests reach a local model only through an explicit rule or an explicit `ollama` provider selection.
- **Sanitize before display** — endpoint addresses and local paths are sanitized (userinfo stripped, secret query params dropped, control characters removed, length bounded) before they reach tool output, the `/ollama` command, or error messages.
- **No stored credentials** — the plugin stores no credentials and reads none; it only performs HTTP requests to the endpoint you configured.
- **Zero bundled models** — no model files are shipped; downloads and storage are Ollama's own responsibility.

Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.
