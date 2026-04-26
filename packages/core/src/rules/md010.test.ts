import { describe, it, expect } from 'vitest'
import { lintString } from '../lint.js'
import { md010Rule, md010Fixer } from './md010.js'

describe('md010Rule — no hard tabs', () => {
  it('produces no violations for content without tabs', async () => {
    const result = await lintString('# Hello\n\nNo tabs here.\n', {
      plugins: [md010Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a line containing a hard tab', async () => {
    const result = await lintString('hello\there\n', { plugins: [md010Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md010|hard.tab|no.hard/)
    expect(result.violations[0]?.line).toBe(1)
  })

  it('reports one violation per line regardless of tab count on that line', async () => {
    const result = await lintString('\ta\t\tb\n\tc\n', { plugins: [md010Rule] })
    expect(result.violations).toHaveLength(2)
  })

  it('does not flag spaces used for indentation', async () => {
    const result = await lintString('    indented with spaces\n', {
      plugins: [md010Rule],
    })
    expect(result.violations).toHaveLength(0)
  })
})

describe('md010Fixer', () => {
  it('replaces tabs with 4 spaces by default', () => {
    expect(md010Fixer('\thello\n')).toBe('    hello\n')
  })

  it('replaces multiple tabs on a single line', () => {
    expect(md010Fixer('\t\thello\n')).toBe('        hello\n')
  })

  it('accepts a custom tabSize option', () => {
    expect(md010Fixer('\thello\n', { tabSize: 2 })).toBe('  hello\n')
  })

  it('preserves content without tabs', () => {
    const clean = 'no tabs here\n'
    expect(md010Fixer(clean)).toBe(clean)
  })

  it('handles empty string', () => {
    expect(md010Fixer('')).toBe('')
  })

  it('replaces tabs in the middle of a line', () => {
    expect(md010Fixer('hello\tworld\n')).toBe('hello    world\n')
  })
})
