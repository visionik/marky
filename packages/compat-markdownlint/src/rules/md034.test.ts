import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md034Rule } from './md034.js'

describe('md034Rule — no bare URLs', () => {
  it('produces no violations for a proper Markdown link', async () => {
    const md = 'See [the docs](https://example.com) for details.\n'
    const result = await lintString(md, { plugins: [md034Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for an angle-bracket autolink', async () => {
    const md = 'Visit <https://example.com> today.\n'
    const result = await lintString(md, { plugins: [md034Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a bare URL in paragraph text', async () => {
    // remark-gfm turns bare URLs into link nodes; we detect them by source position
    const md = 'Visit https://example.com today.\n'
    const result = await lintString(md, { plugins: [md034Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md034|bare.url/)
  })

  it('reports a violation for a bare URL at the start of a line', async () => {
    const md = 'https://example.com\n'
    const result = await lintString(md, { plugins: [md034Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('does not flag URLs inside inline code', async () => {
    const md = 'Use `https://example.com` as the base URL.\n'
    const result = await lintString(md, { plugins: [md034Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for a document with no URLs', async () => {
    const result = await lintString('# Hello\n\nJust text.\n', {
      plugins: [md034Rule],
    })
    expect(result.violations).toHaveLength(0)
  })
})
