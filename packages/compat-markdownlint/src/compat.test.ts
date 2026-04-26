import { describe, it, expect } from 'vitest'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lintString } from '@marky/core'
import { loadMarkdownlintConfig } from './compat.js'

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'marky-compat-test-'))
}

describe('loadMarkdownlintConfig', () => {
  it('returns empty plugins when no config file is present', async () => {
    const dir = await makeTempDir()
    try {
      const config = await loadMarkdownlintConfig(dir)
      expect(config.plugins).toEqual([])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('loads .markdownlintrc and returns plugins for enabled rules', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD013: true, MD041: true }))
      const config = await loadMarkdownlintConfig(dir)
      expect(config.plugins?.length).toBeGreaterThanOrEqual(2)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('loads .markdownlint.json', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlint.json'), JSON.stringify({ MD013: true }))
      const config = await loadMarkdownlintConfig(dir)
      expect(config.plugins?.length).toBeGreaterThanOrEqual(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('skips rules that are set to false', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD013: false, MD041: true }))
      const config = await loadMarkdownlintConfig(dir)
      // Only MD041 should be included
      expect(config.plugins).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('ignores unrecognised rule IDs gracefully', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD999: true, MD013: true }))
      const config = await loadMarkdownlintConfig(dir)
      // MD999 is unknown — only MD013 maps to a plugin
      expect(config.plugins).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('the returned plugins actually lint content correctly', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD041: true }))
      const config = await loadMarkdownlintConfig(dir)
      const result = await lintString('Not a heading.\n', config)
      expect(result.violations).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
