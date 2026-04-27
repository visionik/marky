import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md033Rule } from './md033.js'

describe('md033Rule — no inline HTML', () => {
  it('produces no violations for clean Markdown', async () => {
    const result = await lintString('# Hello\n\nParagraph.\n', { plugins: [md033Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a block HTML element', async () => {
    const md = '# Title\n\n<div>some content</div>\n'
    const result = await lintString(md, { plugins: [md033Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md033|html/)
  })

  it('reports a violation for a self-closing HTML tag', async () => {
    const md = '# Title\n\n<br/>\n'
    const result = await lintString(md, { plugins: [md033Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('produces no violations for Markdown without HTML', async () => {
    const md = '- item one\n- item two\n\n**bold** and *italic*\n'
    const result = await lintString(md, { plugins: [md033Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
