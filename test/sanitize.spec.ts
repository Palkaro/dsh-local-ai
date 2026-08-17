/**
 * Sanitization contract: every pure function bounds length, strips control
 * characters, and redacts secrets. Endpoint addresses and local paths are the
 * extreme cases exercised here (embedded userinfo, secret query params, home
 * directories, and hostile lengths).
 * @module dsh-local-ai/test/sanitize.spec
 */

import { describe, expect, it } from 'vitest'
import { redactSecrets, sanitizeEndpoint, sanitizePath, sanitizeText, truncate } from '../src/sanitize.ts'

describe('truncate', () => {
  it('bounds long strings with an ellipsis and passes short ones through', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('hello world', 8)).toBe('hello w…')
    expect(truncate('hello', 0)).toBe('')
    expect(truncate('hello', 1)).toBe('…')
  })
})

describe('sanitizeEndpoint', () => {
  it('strips userinfo and secret query parameters', () => {
    const out = sanitizeEndpoint('http://user:secret@127.0.0.1:11434/api?token=abc&q=1')
    expect(out).not.toContain('user')
    expect(out).not.toContain('secret')
    expect(out).not.toContain('token=abc')
    expect(out).toContain('q=1')
  })

  it('bounds an extreme-length endpoint', () => {
    const out = sanitizeEndpoint(`http://host/${'a'.repeat(5000)}`, 100)
    expect(out.length).toBeLessThanOrEqual(100)
    expect(out.endsWith('…')).toBe(true)
  })

  it('handles a non-URL value without throwing', () => {
    expect(sanitizeEndpoint(':::not a url:::')).toBe(':::not a url:::')
    expect(sanitizeEndpoint(12345)).toBe('12345')
  })
})

describe('sanitizePath', () => {
  it('redacts a leading home directory to ~', () => {
    expect(sanitizePath('C:\\Users\\alice\\.ollama\\models', 'C:\\Users\\alice')).toBe('~\\.ollama\\models')
  })

  it('strips control characters and bounds length', () => {
    expect(sanitizePath('a\u0000b\u001fc')).toBe('abc')
    expect(sanitizePath(`${'x'.repeat(5000)}`, '', 20).length).toBeLessThanOrEqual(20)
  })

  it('handles non-string input', () => {
    expect(sanitizePath(undefined)).toBe('undefined')
    expect(sanitizePath(null)).toBe('null')
  })
})

describe('redactSecrets and sanitizeText', () => {
  it('redacts API keys, bearer credentials, and PEM private keys', () => {
    // Token-shaped samples are built by concatenation so no literal that
    // resembles a real secret (e.g. `sk-`/`ghp_` + characters) ever enters the
    // repository — GitHub secret scanning push protection would block it.
    const apiKey = `${'sk-'}${'a'.repeat(24)}`
    const bearer = `${'Bearer '}${'b'.repeat(24)}`
    const pemHeader = ['-----BEGIN', 'RSA', 'PRIVATE', 'KEY-----'].join(' ')
    const pemFooter = ['-----END', 'RSA', 'PRIVATE', 'KEY-----'].join(' ')
    const pem = `${pemHeader}\nAAAA\n${pemFooter}`

    expect(redactSecrets(`token ${apiKey}`)).not.toContain(apiKey)
    expect(redactSecrets(`Authorization: ${bearer}`)).not.toContain(bearer)
    expect(redactSecrets(pem)).not.toContain('PRIVATE KEY')
  })

  it('sanitizes and truncates arbitrary text', () => {
    expect(sanitizeText('clean text')).toBe('clean text')
    expect(sanitizeText(`${'a'.repeat(1000)}`, 50).length).toBeLessThanOrEqual(50)
  })
})
