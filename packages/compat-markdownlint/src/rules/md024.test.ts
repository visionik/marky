import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md024Rule } from './md024.js'

describe('md024Rule — no duplicate heading content', () => {
  it('produces no violations when all headings are unique', async () => {
    const md = '# Introduction\n\n## Overview\n\n### Details\n'
    const result = await lintString(md, { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for two headings with identical text', async () => {
    const md = '# Introduction\n\n## Section\n\n# Introduction\n'
    const result = await lintString(md, { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md024|duplicate/)
    // Violation should point to the second occurrence
    expect(result.violations[0]?.line).toBe(5)
  })

  it('is case-sensitive — different casing is not a duplicate', async () => {
    const md = '# Introduction\n\n# introduction\n'
    const result = await lintString(md, { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('flags duplicates across different heading levels', async () => {
    const md = '# Overview\n\n## Overview\n'
    const result = await lintString(md, { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(1)
  })

  it('reports multiple violations when there are several duplicates', async () => {
    const md = '# A\n\n# B\n\n# A\n\n# B\n'
    const result = await lintString(md, { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(2)
  })

  it('handles a document with no headings', async () => {
    const result = await lintString('Just text.\n', { plugins: [md024Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
