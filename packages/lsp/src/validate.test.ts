import { describe, it, expect } from 'vitest'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { validateMarkdown } from './validate.js'
import { lintRule } from 'unified-lint-rule'
import type { Root, Paragraph } from 'mdast'
import type { VFile } from 'vfile'
import { visit } from 'unist-util-visit'

/** Rule that flags every paragraph — easy to trigger. */
const alwaysWarnRule = lintRule('test:always-warn', (tree: Root, file: VFile) => {
  visit(tree, 'paragraph', (node: Paragraph) => {
    file.message('always warns', node.position)
  })
})

describe('validateMarkdown', () => {
  it('returns empty diagnostics for clean content with no plugins', async () => {
    const diags = await validateMarkdown('# Hello\n\nClean.\n', 'file:///test.md', {})
    expect(diags).toHaveLength(0)
  })

  it('returns diagnostics for content that triggers a plugin', async () => {
    const diags = await validateMarkdown('some paragraph\n', 'file:///test.md', {
      plugins: [alwaysWarnRule],
    })
    expect(diags.length).toBeGreaterThanOrEqual(1)
    expect(diags[0]?.severity).toBe(DiagnosticSeverity.Warning)
  })

  it('uses DiagnosticSeverity.Error for error-severity violations', async () => {
    // Use rules config to elevate to 'error' severity—more reliable than msg.fatal
    const myRule = lintRule('test:my-rule', (_tree: Root, file: VFile) => {
      file.message('becomes an error')
    })
    const diags = await validateMarkdown('# Hello\n', 'file:///test.md', {
      plugins: [myRule],
      rules: { 'test:my-rule': 'error' },
    })
    expect(diags.length).toBeGreaterThanOrEqual(1)
    expect(diags[0]?.severity).toBe(DiagnosticSeverity.Error)
  })

  it('positions are 0-indexed (LSP convention)', async () => {
    const lineOneRule = lintRule('test:line-one', (_tree: Root, file: VFile) => {
      file.message('first line', { line: 1, column: 1 })
    })
    const diags = await validateMarkdown('content\n', 'file:///test.md', {
      plugins: [lineOneRule],
    })
    expect(diags[0]?.range.start.line).toBe(0)
    expect(diags[0]?.range.start.character).toBe(0)
  })

  it('handles empty string without error', async () => {
    const diags = await validateMarkdown('', 'file:///empty.md', {})
    expect(Array.isArray(diags)).toBe(true)
  })
})
