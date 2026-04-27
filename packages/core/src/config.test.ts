import { describe, it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from './config.js'

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'marky-config-test-'))
}

describe('loadConfig', () => {
  it('returns an empty config when crackdown.config.ts is not present', async () => {
    const dir = await makeTempDir()
    try {
      const config = await loadConfig(dir)
      expect(config).toEqual({})
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('loads crackdown.config.ts found in the given cwd', async () => {
    const dir = await makeTempDir()
    try {
      const configSource = `export default {
  rules: { 'remark-lint:no-heading-punctuation': 'error' },
  plugins: [],
}\n`
      await writeFile(join(dir, 'crackdown.config.ts'), configSource)
      const config = await loadConfig(dir)
      expect(config.rules).toEqual({
        'remark-lint:no-heading-punctuation': 'error',
      })
      expect(Array.isArray(config.plugins)).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('walks up the directory tree to find crackdown.config.ts', async () => {
    const dir = await makeTempDir()
    try {
      const sub = join(dir, 'a', 'b', 'c')
      await mkdir(sub, { recursive: true })
      const configSource = `export default {
  rules: { 'walked:rule': 'warn' },
}\n`
      await writeFile(join(dir, 'crackdown.config.ts'), configSource)
      const config = await loadConfig(sub)
      expect(config.rules).toEqual({ 'walked:rule': 'warn' })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('throws a descriptive error when the config default export is not an object', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, 'crackdown.config.ts'), `export default 'not-an-object'\n`)
      await expect(loadConfig(dir)).rejects.toThrow(/crackdown\.config\.ts/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('throws a descriptive error when rules has invalid severity values', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(
        join(dir, 'crackdown.config.ts'),
        `export default { rules: { 'a:b': 'sometimes' } }\n`,
      )
      await expect(loadConfig(dir)).rejects.toThrow(/severity/i)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('throws a descriptive error when plugins is not an array', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, 'crackdown.config.ts'), `export default { plugins: 'oops' }\n`)
      await expect(loadConfig(dir)).rejects.toThrow(/plugins/i)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('returns an empty config when the default export is null', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, 'crackdown.config.ts'), `export default null\n`)
      const config = await loadConfig(dir)
      expect(config).toEqual({})
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
