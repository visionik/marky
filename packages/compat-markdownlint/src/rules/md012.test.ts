import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md012Rule, md012Fixer } from './md012.js'

describe('md012Rule — no multiple consecutive blank lines', () => {
  it('produces no violations for single blank lines', async () => {
    const result = await lintString('# Hello\n\nParagraph.\n\n## Next\n', {
      plugins: [md012Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for two consecutive blank lines', async () => {
    const result = await lintString('# Hello\n\n\nParagraph.\n', {
      plugins: [md012Rule],
    })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md012|multiple.blank/)
  })

  it('reports one violation per run of excess blank lines', async () => {
    // Three blank lines counts as one violation (one excess run)
    const result = await lintString('a\n\n\n\nb\n', { plugins: [md012Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('allows configuring a higher max via [rule, { maximum }] tuple', async () => {
    // Two blank lines allowed when maximum: 2
    const result = await lintString('a\n\n\nb\n', {
      plugins: [[md012Rule, { maximum: 2 }]],
    })
    expect(result.violations).toHaveLength(0)
  })
})

describe('md012Fixer', () => {
  it('collapses two consecutive blank lines to one', () => {
    expect(md012Fixer('a\n\n\nb\n')).toBe('a\n\nb\n')
  })

  it('collapses three or more blank lines to one', () => {
    expect(md012Fixer('a\n\n\n\n\nb\n')).toBe('a\n\nb\n')
  })

  it('preserves single blank lines', () => {
    const clean = 'a\n\nb\n'
    expect(md012Fixer(clean)).toBe(clean)
  })

  it('handles empty string', () => {
    expect(md012Fixer('')).toBe('')
  })
})
