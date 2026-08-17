/**
 * Health checks for the local Ollama server: API responsiveness over HTTP and
 * process liveness through the real subprocess seam (the `ollama` CLI's own
 * channel). Both signals are independent — a server that answers HTTP but has
 * no reachable CLI, or vice versa, is reported as two facts, never conflated.
 * @module dsh-local-ai/health
 */

import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { apiVersion } from './ollama.ts'
import type { FetchLike } from './ollama.ts'
import { sanitizeText } from './sanitize.ts'
import { tmpdir } from 'node:os'

/** The HTTP responsiveness result. */
export interface ApiHealth {
  readonly ok: boolean
  readonly version?: string
  readonly error?: string
}

/** The process liveness result. */
export interface ProcessHealth {
  readonly present: boolean
  readonly error?: string
}

/** The combined health result. */
export interface HealthResult {
  readonly api: ApiHealth
  readonly process: ProcessHealth
}

/** The subprocess probe used to test process liveness. */
export interface ProcessProbe {
  readonly command: string
  readonly args: readonly string[]
}

/** The default probe: `ollama list` reaches the server through the CLI's own channel. */
export const OLLAMA_PROCESS_PROBE: ProcessProbe = { command: 'ollama', args: ['list'] }

/**
 * Check whether the Ollama HTTP API responds to `/api/version` within a
 * deadline. A timeout, transport failure, or non-2xx response is `ok: false`
 * with a sanitized error.
 * @param baseURL - the Ollama base URL.
 * @param fetchImpl - the fetch implementation.
 * @param timeoutMs - deadline in milliseconds.
 * @returns the API health result.
 */
export async function checkApiHealth(
  baseURL: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<ApiHealth> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs)
  try {
    const version = await apiVersion(baseURL, fetchImpl, controller.signal)
    return { ok: true, version: sanitizeText(version, 64) }
  } catch (error: unknown) {
    return { ok: false, error: sanitizeText(error instanceof Error ? error.message : String(error), 500) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Check process liveness through the subprocess seam by spawning the probe
 * command in collect mode. Exit code 0 means the CLI (and, for the default
 * `ollama list` probe, the server it talks to) is alive; a missing executable
 * or non-zero exit is `present: false` with a sanitized error.
 * @param subprocess - the real subprocess runtime.
 * @param graceMs - terminate grace for the spawned probe.
 * @param probe - the command to probe with (defaults to `ollama list`).
 * @returns the process health result.
 */
export async function checkProcessHealth(
  subprocess: SubprocessRuntime,
  graceMs: number,
  probe: ProcessProbe = OLLAMA_PROCESS_PROBE,
): Promise<ProcessHealth> {
  let executable: string
  try {
    executable = await subprocess.resolveExecutable(probe.command)
  } catch (error: unknown) {
    return {
      present: false,
      error: sanitizeText(`"${probe.command}" not found: ${error instanceof Error ? error.message : String(error)}`, 500),
    }
  }
  const handle = subprocess.spawn({
    argv: [executable, ...probe.args],
    cwd: tmpdir(),
    stdio: {
      stdin: 'ignore',
      stdout: { maxBytes: 4096 },
      stderr: { maxBytes: 4096 },
    },
    graceMs,
  })
  const outcome = await handle.done
  if (outcome.exitCode === 0) return { present: true }
  const stderr = handle.collected.stderr?.readFrom(0).text ?? ''
  return {
    present: false,
    error: sanitizeText(stderr.trim().length > 0 ? stderr : `exit code ${String(outcome.exitCode)}`, 500),
  }
}

/**
 * Check both health signals.
 * @param baseURL - the Ollama base URL.
 * @param fetchImpl - the fetch implementation.
 * @param subprocess - the real subprocess runtime.
 * @param requestTimeoutMs - HTTP deadline in milliseconds.
 * @param graceMs - subprocess terminate grace in milliseconds.
 * @returns the combined health result.
 */
export async function checkHealth(
  baseURL: string,
  fetchImpl: FetchLike,
  subprocess: SubprocessRuntime,
  requestTimeoutMs: number,
  graceMs: number,
): Promise<HealthResult> {
  const [api, process] = await Promise.all([
    checkApiHealth(baseURL, fetchImpl, requestTimeoutMs),
    checkProcessHealth(subprocess, graceMs),
  ])
  return { api, process }
}
