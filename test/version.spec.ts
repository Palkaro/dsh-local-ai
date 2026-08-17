/**
 * The plugin version string stays in sync with package.json (the release
 * script bumps both together).
 * @module dsh-local-ai/test/version.spec
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/version.ts'

describe('VERSION', () => {
  it('matches the package.json version', () => {
    const pkg = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8')) as { version: string }
    expect(VERSION).toBe(pkg.version)
  })
})
