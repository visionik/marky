import { describe, it, expect } from 'vitest'
import { writeFile, mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lintStringFix, lintFileFix } from './fix.js'
import type { Fixer } from './types.js'

/** A fixer that uppercases every character — easy to assert. */
const uppercaseFixer: Fixer = (content) => content.toUpperCase()

/** A fixer that does nothing. */
const noopFixer: Fixer = (content) => content

/** A lint plugin that fires on every paragraph (always produces violations). */
import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
const alwaysWarnRule = lintRule('test:always-warn', (tree: Root, file) => {
  visit(tree, 'paragraph', (node) => {
    file.message('always warns', node.position)
  })
})

describe('lintStringFix', () => {
  it('returns original content unchanged when no fixers configured', async () => {
    const content = '# Hello\n\nWorld.\n'
    const result = await lintStringFix(content, { plugins: [alwaysWarnRule] })
    expect(result.fixed).toBe(content)
    expect(result.fixedCount).toBe(0)
  })

  it('applies fixers and returns transformed content', async () => {
    const content = 'hello\n'
    const result = await lintStringFix(content, { fixers: [uppercaseFixer] })
    expect(result.fixed).toBe('HELLO\n')
  })

  it('applies multiple fixers in order', async () => {
    const addA: Fixer = (c) => c + 'A'
    const addB: Fixer = (c) => c + 'B'
    const result = await lintStringFix('X\n', { fixers: [addA, addB] })
    expect(result.fixed).toBe('X\nAB')
  })

  it('fixedCount equals violations resolved by fixers', async () => {
    // alwaysWarnRule fires once per paragraph
    const content = 'paragraph here\n'
    // The uppercase fixer changes the content so alwaysWarnRule still fires
    // (it fires regardless of content). Use noopFixer to keep violations stable.
    const result = await lintStringFix(content, {
      plugins: [alwaysWarnRule],
      fixers: [noopFixer],
    })
    // noop fixer doesn't change content, so violations are unchanged; fixedCount = 0
    expect(result.fixedCount).toBe(0)
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('fixedCount > 0 when fixers resolve violations', async () => {
    // A rule that flags lines with trailing spaces
    const trailingSpaceRule = lintRule('test:trailing-space', (tree: Root, file) => {
      const lines = String(file).split('\n')
      lines.forEach((line, i) => {
        if (line !== line.trimEnd()) {
          file.message('trailing space', { line: i + 1, column: line.trimEnd().length + 1 })
        }
      })
    })
    const trimFixer: Fixer = (c) =>
      c
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n')

    const content = 'hello   \nworld\n'
    const result = await lintStringFix(content, {
      plugins: [trailingSpaceRule],
      fixers: [trimFixer],
    })
    expect(result.fixed).toBe('hello\nworld\n')
    expect(result.fixedCount).toBe(1)
    expect(result.violations).toHaveLength(0)
  })

  it('returns the correct filename in the result', async () => {
    const result = await lintStringFix('x\n', {}, 'myfile.md')
    expect(result.file).toBe('myfile.md')
  })

  it('unfixable violations remain in the result after fixing', async () => {
    const result = await lintStringFix('hello\n', {
      plugins: [alwaysWarnRule],
      fixers: [noopFixer],
    })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })
})

describe('lintFileFix', () => {
  it('reads a file from disk, fixes it, and returns FixResult', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'marky-fix-test-'))
    const filePath = join(dir, 'test.md')
    try {
      await writeFile(filePath, 'hello   \nworld\n')
      const trimFixer: Fixer = (c) =>
        c
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n')
      const result = await lintFileFix(filePath, { fixers: [trimFixer] })
      expect(result.file).toBe(filePath)
      expect(result.fixed).toBe('hello\nworld\n')
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does NOT write the fixed content back to disk (callers handle writes)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'marky-fix-test-'))
    const filePath = join(dir, 'test.md')
    const original = 'hello   \n'
    try {
      await writeFile(filePath, original)
      const trimFixer: Fixer = (c) =>
        c
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n')
      await lintFileFix(filePath, { fixers: [trimFixer] })
      // File on disk must be unchanged — lintFileFix is read-only
      const onDisk = await readFile(filePath, 'utf8')
      expect(onDisk).toBe(original)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
