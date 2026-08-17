/**
 * Display/log sanitization for `dsh-local-ai`. Every value shown to the model
 * or to the user (tool results, the `/ollama` command, error messages) passes
 * through one of these pure functions first, so an endpoint address or a local
 * path can never leak credentials, secret query parameters, or unbounded text.
 *
 * All functions are pure: they depend only on their arguments, never on
 * process state (the caller supplies a home directory for path redaction).
 * @module dsh-local-ai/sanitize
 */

/** Placeholder substituted for a redacted secret or credential. */
export const REDACTED = '[REDACTED]'

/** Control characters (C0 + DEL) stripped from every sanitized value. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/gu

/** Secret-shaped query-parameter keys removed from endpoint URLs. */
const SECRET_KEY_PATTERN = /key|token|secret|password|credential|auth/iu

/** Built-in secret literal patterns redacted from arbitrary text. */
const BUILTIN_SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9]{16,}\b/u,
  /\bghp_[A-Za-z0-9]{20,}\b/u,
  /\bgho_[A-Za-z0-9]{20,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/u,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[A-Za-z0-9+/=\s]*-----END [A-Z ]*PRIVATE KEY-----/u,
] as const

/** Remove C0/DEL control characters from a string. */
export function stripControl(value: string): string {
  return value.replace(CONTROL_CHARS, '')
}

/**
 * Truncate a string to `maxChars`, appending an ellipsis when it was cut.
 * A non-positive `maxChars` yields the empty string.
 * @param value - the string to bound.
 * @param maxChars - maximum returned length, including the ellipsis.
 * @returns the bounded string.
 */
export function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  if (maxChars <= 1) return maxChars <= 0 ? '' : '…'
  return `${value.slice(0, maxChars - 1)}…`
}

/**
 * Sanitize an endpoint address for display: strip the URL userinfo
 * (`user:pass@`), drop query parameters whose key looks like a secret, strip
 * control characters, and bound the length. Values that are not parseable as
 * a URL are still stripped and truncated.
 * @param value - the raw endpoint (URL string or anything stringifiable).
 * @param maxChars - maximum returned length.
 * @returns the sanitized endpoint text.
 */
export function sanitizeEndpoint(value: unknown, maxChars = 2048): string {
  const text = stripControl(typeof value === 'string' ? value : String(value))
  let out: string
  try {
    const url = new URL(text)
    url.username = ''
    url.password = ''
    for (const key of [...url.searchParams.keys()]) {
      if (SECRET_KEY_PATTERN.test(key)) url.searchParams.delete(key)
    }
    out = url.href
  } catch {
    out = text
  }
  return truncate(out, maxChars)
}

/**
 * Sanitize a local path for display: strip control characters, redact a
 * leading home directory to `~`, and bound the length.
 * @param value - the raw path (string or anything stringifiable).
 * @param home - the user's home directory to redact; omit to skip redaction.
 * @param maxChars - maximum returned length.
 * @returns the sanitized path text.
 */
export function sanitizePath(value: unknown, home = '', maxChars = 1024): string {
  const text = stripControl(typeof value === 'string' ? value : String(value))
  const redacted = home.length > 0 && text.startsWith(home)
    ? `~${text.slice(home.length)}`
    : text
  return truncate(redacted, maxChars)
}

/**
 * Redact built-in secret literals (API keys, GitHub tokens, AWS keys, bearer
 * credentials, PEM private keys) from arbitrary text. Control characters are
 * stripped first.
 * @param value - the raw text (string or anything stringifiable).
 * @returns the text with secret literals replaced by {@link REDACTED}.
 */
export function redactSecrets(value: unknown): string {
  const text = stripControl(typeof value === 'string' ? value : String(value))
  let out = text
  for (const pattern of BUILTIN_SECRET_PATTERNS) out = out.replace(pattern, REDACTED)
  return out
}

/**
 * Sanitize arbitrary display text: redact secrets, strip control characters,
 * and bound the length.
 * @param value - the raw text (string or anything stringifiable).
 * @param maxChars - maximum returned length.
 * @returns the sanitized text.
 */
export function sanitizeText(value: unknown, maxChars = 4000): string {
  return truncate(redactSecrets(value), maxChars)
}
