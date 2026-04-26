import { describe, it, expect } from 'vitest'
import { lintString, lintFile } from './lint.js'
import type { Plugin } from './types.js'
import { lintRule } from 'unified-lint-rule'
import type { Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** A rule that flags every heading whose text contains "FAIL". */
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

describe('lintString', () => {
  it('returns empty violations for valid Markdown', async () => {
    const result = await lintString('# Hello\n\nThis is fine.\n', [])
    expect(result.violations).toHaveLength(0)
  })

  it('returns a violation when a rule fires', async () => {
    const result = await lintString('# FAIL this heading\n', [failHeadingRule])
    expect(result.violations).toHaveLength(1)
    const v = result.violations[0]
    expect(v).toBeDefined()
    expect(v!.ruleId).toBe('test:fail-heading')
    expect(v!.line).toBe(1)
    expect(v!.column).toBe(1)
    expect(v!.message).toContain('FAIL')
  })

  it('reports severity as "warn" by default', async () => {
    const result = await lintString('# FAIL\n', [failHeadingRule])
    expect(result.violations[0]?.severity).toBe('warn')
  })

  it('parses GFM tables without error', async () => {
    const gfmTable = '| a | b |\n|---|---|\n| 1 | 2 |\n'
    const result = await lintString(gfmTable, [])
    expect(result.violations).toHaveLength(0)
  })

  it('returns the filename in the result', async () => {
    const result = await lintString('# Hi\n', [], 'test.md')
    expect(result.file).toBe('test.md')
  })
})

describe('lintString ruleId fallback', () => {
  it('uses source alone when ruleId is absent', async () => {
    const sourceOnlyRule: Plugin = () => (_tree, file) => {
      const msg = file.message('source-only message')
      msg.source = 'my-source'
      msg.ruleId = undefined
    }
    const result = await lintString('# ok\n', [sourceOnlyRule])
    expect(result.violations[0]?.ruleId).toBe('my-source')
  })

  it('reports severity "error" when msg.fatal is true', async () => {
    const fatalRule: Plugin = () => (_tree, file) => {
      const msg = file.message('fatal error')
      msg.fatal = true
    }
    const result = await lintString('# ok\n', [fatalRule])
    expect(result.violations[0]?.severity).toBe('error')
  })

  it('falls back to line 1 / column 1 when position is absent', async () => {
    const noPositionRule: Plugin = () => (_tree, file) => {
      file.message('no position')
    }
    const result = await lintString('# ok\n', [noPositionRule])
    expect(result.violations[0]?.line).toBe(1)
    expect(result.violations[0]?.column).toBe(1)
  })
})

describe('lintFile', () => {
  it('reads a file from disk and lints it', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'marky-test-'))
    const filePath = join(dir, 'test.md')
    try {
      await writeFile(filePath, '# Hello world\n')
      const result = await lintFile(filePath, [])
      expect(result.file).toBe(filePath)
      expect(result.violations).toHaveLength(0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
