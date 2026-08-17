/**
 * Config contract: the Schemastery schema fills defaults on empty input, and
 * `resolveConfig` fails loud on invalid URLs, numeric bounds, duplicate model
 * names, and rule-less routes — never silently half-configuring the adapter.
 * @module dsh-local-ai/test/config.spec
 */

import { describe, expect, it } from 'vitest'
import { Config, normalizeBaseUrl, ollamaModelOf, resolveConfig } from '../src/config.ts'

describe('Config schema', () => {
  it('applies every default on an empty input', () => {
    const resolved = Config({})
    expect(resolved.baseURL).toBe('http://127.0.0.1:11434')
    expect(resolved.requestTimeoutMs).toBe(30_000)
    expect(resolved.graceMs).toBe(15_000)
    expect(resolved.defaultContextWindow).toBe(8192)
    expect(resolved.maxTokens).toBe(4096)
    expect(resolved.temperature).toBeUndefined()
    expect(resolved.models).toEqual([])
    expect(resolved.route).toEqual([])
  })

  it('fills route sub-defaults (keywords/always) for a configured rule', () => {
    const resolved = Config({ route: [{ model: 'local' }] })
    expect(resolved.route?.[0]).toMatchObject({ model: 'local', keywords: [], always: false })
  })
})

describe('normalizeBaseUrl', () => {
  it('strips a trailing slash, query, and fragment', () => {
    expect(normalizeBaseUrl('baseURL', 'http://127.0.0.1:11434/')).toBe('http://127.0.0.1:11434')
    expect(normalizeBaseUrl('baseURL', 'http://127.0.0.1:11434?token=abc#frag')).toBe('http://127.0.0.1:11434')
  })

  it('rejects a malformed or non-http(s) URL', () => {
    expect(() => normalizeBaseUrl('baseURL', 'not a url')).toThrow(/valid URL/u)
    expect(() => normalizeBaseUrl('baseURL', 'ftp://x')).toThrow(/http\(s\)/u)
  })
})

describe('resolveConfig', () => {
  it('rejects a non-positive request timeout', () => {
    expect(() => resolveConfig({ requestTimeoutMs: 0 })).toThrow(/requestTimeoutMs/u)
    expect(() => resolveConfig({ requestTimeoutMs: -5 })).toThrow(/requestTimeoutMs/u)
  })

  it('rejects a temperature outside [0, 2]', () => {
    expect(() => resolveConfig({ temperature: 3 })).toThrow(/temperature/u)
    expect(() => resolveConfig({ temperature: -0.1 })).toThrow(/temperature/u)
  })

  it('rejects a duplicate model name', () => {
    expect(() => resolveConfig({
      models: [{ name: 'local' }, { name: 'local', model: 'other' }],
    })).toThrow(/duplicate model name/u)
  })

  it('rejects a rule with no purpose, keyword, or always', () => {
    expect(() => resolveConfig({ route: [{ model: 'x' }] })).toThrow(/purpose/u)
  })

  it('resolves model mappings with identity defaults', () => {
    const resolved = resolveConfig({ models: [{ name: 'local', model: 'llama3.2', contextWindow: 4096 }] })
    expect(resolved.models[0]).toEqual({ name: 'local', model: 'llama3.2', contextWindow: 4096 })
    expect(ollamaModelOf(resolved, 'local')).toBe('llama3.2')
    expect(ollamaModelOf(resolved, 'unmapped')).toBeUndefined()
  })

  it('resolves the Ollama base URL', () => {
    const resolved = resolveConfig({ baseURL: 'http://localhost:11434/' })
    expect(resolved.baseURL).toBe('http://localhost:11434')
  })
})
