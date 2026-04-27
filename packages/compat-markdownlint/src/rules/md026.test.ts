import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md026Rule } from './md026.js'

describe('md026Rule — no trailing punctuation in headings', () => {
  it('produces no violations for a heading without trailing punctuation', async () => {
    const result = await lintString('# Hello World\n', { plugins: [md026Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a heading ending with a period', async () => {
    const result = await lintString('# Hello World.\n', { plugins: [md026Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md026|trailing.punct/)
  })

  it('reports violations for !, ?, :, ;', async () => {
    for (const char of ['!', '?', ':', ';']) {
      const result = await lintString(`# Hello${char}\n`, { plugins: [md026Rule] })
      expect(result.violations.length, `should flag trailing ${char}`).toBeGreaterThanOrEqual(1)
    }
  })

  it('does not flag headings ending with a word character', async () => {
    const result = await lintString('# 100% done\n', { plugins: [md026Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles multiple headings — only flags offending ones', async () => {
    const md = '# Good heading\n\n## Bad heading!\n\n### Also good\n'
    const result = await lintString(md, { plugins: [md026Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.line).toBe(3)
  })
})
