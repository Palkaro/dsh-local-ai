/**
 * Health checks: API responsiveness over a scripted `fetch` and process
 * liveness through the REAL local subprocess provider (spawning a probe
 * command, not a hand-written mock).
 * @module dsh-local-ai/test/health.spec
 */

import { afterAll, describe, expect, it } from 'vitest'
import { checkApiHealth, checkProcessHealth } from '../src/health.ts'
import type { FetchLike } from '../src/ollama.ts'
import { mountServices } from './harness.ts'

const BASE = 'http://127.0.0.1:11434'

const okFetch: FetchLike = async () => new Response(JSON.stringify({ version: '0.9.0' }), { status: 200 })
const downFetch: FetchLike = async () => { throw new Error('connection refused') }

describe('checkApiHealth', () => {
  it('reports ok with the sanitized version', async () => {
    const result = await checkApiHealth(BASE, okFetch, 5000)
    expect(result).toEqual({ ok: true, version: '0.9.0' })
  })

  it('reports not-ok with a sanitized error on transport failure', async () => {
    const result = await checkApiHealth(BASE, downFetch, 5000)
    expect(result.ok).toBe(false)
    expect(result.error).toContain('connection refused')
  })
})

describe('checkProcessHealth', () => {
  const ctxPromise = mountServices()

  afterAll(async () => {
    // Dispose the mounted services (the subprocess provider owns live handles).
    const ctx = await ctxPromise
    await ctx.fiber.dispose().catch(() => undefined)
  })

  it('reports present when the probe command exits 0', async () => {
    const ctx = await ctxPromise
    const result = await checkProcessHealth(ctx.subprocess, 10_000, { command: 'node', args: ['--version'] })
    expect(result.present).toBe(true)
  })

  it('reports not-present when the probe command exits non-zero', async () => {
    const ctx = await ctxPromise
    const result = await checkProcessHealth(ctx.subprocess, 10_000, { command: 'node', args: ['--definitely-not-a-real-flag'] })
    expect(result.present).toBe(false)
  })

  it('reports not-present when the probe command is not found', async () => {
    const ctx = await ctxPromise
    const result = await checkProcessHealth(ctx.subprocess, 10_000, { command: 'definitely-not-a-real-binary-xyz', args: [] })
    expect(result.present).toBe(false)
    expect(result.error).toContain('not found')
  })
})
