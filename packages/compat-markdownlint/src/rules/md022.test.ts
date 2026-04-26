import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md022Rule } from './md022.js'

describe('md022Rule — blank lines around headings', () => {
  it('produces no violations for headings surrounded by blank lines', async () => {
    const md = 'Some text.\n\n## Section\n\nMore text.\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations when heading is at the start of the document', async () => {
    const md = '# Title\n\nFirst paragraph.\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations when heading is at the end of the document', async () => {
    const md = 'Paragraph.\n\n## Heading at end\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when no blank line before heading', async () => {
    const md = 'Some text.\n## Heading without blank before\n\nMore text.\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md022|blank/)
  })

  it('reports a violation when no blank line after heading', async () => {
    const md = '## Heading\nText immediately after (no blank line)\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('handles a document with only a heading', async () => {
    const result = await lintString('# Solo\n', { plugins: [md022Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles consecutive headings (each needs surrounding blank lines)', async () => {
    const md = '# H1\n\n## H2\n\n### H3\n'
    const result = await lintString(md, { plugins: [md022Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
