import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md025Rule } from './md025.js'

describe('md025Rule — single top-level heading', () => {
  it('produces no violations for a single H1', async () => {
    const result = await lintString('# Title\n\n## Section\n', {
      plugins: [md025Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for no H1', async () => {
    const result = await lintString('## Section\n\n### Sub\n', {
      plugins: [md025Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a second H1', async () => {
    const md = '# First\n\n## Middle\n\n# Second\n'
    const result = await lintString(md, { plugins: [md025Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md025|top.level/)
    expect(result.violations[0]?.line).toBe(5)
  })

  it('reports violations for each extra H1 beyond the first', async () => {
    const md = '# One\n\n# Two\n\n# Three\n'
    const result = await lintString(md, { plugins: [md025Rule] })
    expect(result.violations).toHaveLength(2)
  })

  it('handles empty document gracefully', async () => {
    const result = await lintString('', { plugins: [md025Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
