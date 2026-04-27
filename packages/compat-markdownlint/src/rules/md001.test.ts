import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md001Rule } from './md001.js'

describe('md001Rule — heading levels increment by one', () => {
  it('produces no violations for sequential headings H1→H2→H3', async () => {
    const md = '# H1\n\n## H2\n\n### H3\n'
    const result = await lintString(md, { plugins: [md001Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for a document with a single heading', async () => {
    const result = await lintString('# Only heading\n', { plugins: [md001Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for headings that decrease in level', async () => {
    const md = '## H2\n\n# H1\n'
    const result = await lintString(md, { plugins: [md001Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when heading jumps more than one level', async () => {
    const md = '# H1\n\n### H3 (skips H2)\n'
    const result = await lintString(md, { plugins: [md001Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md001|heading/)
    expect(result.violations[0]?.line).toBe(3)
  })

  it('reports a violation for H1 → H3 jump', async () => {
    const md = '# Title\n\n### Section (should be H2)\n'
    const result = await lintString(md, { plugins: [md001Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('does not flag H2→H4 as two violations (only one per jump)', async () => {
    const md = '## Start\n\n#### Jump (skips H3)\n'
    const result = await lintString(md, { plugins: [md001Rule] })
    expect(result.violations).toHaveLength(1)
  })

  it('handles documents with no headings gracefully', async () => {
    const result = await lintString('Just some text.\n\nAnother paragraph.\n', {
      plugins: [md001Rule],
    })
    expect(result.violations).toHaveLength(0)
  })
})
