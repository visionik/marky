import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lint } from './api.js'
import { lintString } from './lint.js'
import { lintRule } from 'unified-lint-rule'
import { visit } from 'unist-util-visit'
import type { Root, Text } from 'mdast'
import type { Plugin } from './types.js'

const failHeadingRule: Plugin = lintRule('test:fail-heading', (tree: Root, file) => {
  visit(tree, 'heading', (node) => {
    const text = node.children
      .filter((c): c is Text => c.type === 'text')
      .map((c) => c.value)
      .join('')
    if (text.includes('FAIL')) {
      file.message('Heading contains FAIL', node.position)
    }
  })
})

describe('lint (programmatic API)', () => {
  it('returns one LintResult per input file in input order', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'marky-api-test-'))
    try {
      const a = join(dir, 'a.md')
      const b = join(dir, 'b.md')
      await writeFile(a, '# clean heading\n')
      await writeFile(b, '# FAIL heading\n')

      const results = await lint([a, b], { plugins: [failHeadingRule] })
      expect(results).toHaveLength(2)
      expect(results[0]?.file).toBe(a)
      expect(results[0]?.violations).toHaveLength(0)
      expect(results[1]?.file).toBe(b)
      expect(results[1]?.violations).toHaveLength(1)
      expect(results[1]?.violations[0]?.ruleId).toBe('test:fail-heading')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('returns an empty array when no files are provided', async () => {
    const results = await lint([])
    expect(results).toEqual([])
  })

  it('uses an empty config by default', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'marky-api-test-'))
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# Hello\n')

      const results = await lint([file])
      expect(results).toHaveLength(1)
      expect(results[0]?.violations).toHaveLength(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe('lintString with no config', () => {
  it('returns a result using defaults when called without a config', async () => {
    const result = await lintString('# Hello world\n')
    expect(result.file).toBe('<string>')
    expect(Array.isArray(result.violations)).toBe(true)
  })
})
