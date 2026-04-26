import { describe, it, expect } from 'vitest'
import { lintString } from '../lint.js'
import { md009Rule, md009Fixer } from './md009.js'

describe('md009Rule — no trailing spaces', () => {
  it('produces no violations for clean content', async () => {
    const result = await lintString('# Hello\n\nClean line.\n', {
      plugins: [md009Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a line with trailing spaces', async () => {
    const result = await lintString('hello   \nworld\n', { plugins: [md009Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md009|trailing/)
    expect(result.violations[0]?.line).toBe(1)
  })

  it('reports one violation per offending line', async () => {
    const result = await lintString('a  \nb  \nc\n', { plugins: [md009Rule] })
    expect(result.violations).toHaveLength(2)
  })

  it('ignores lines with only a trailing newline character', async () => {
    const result = await lintString('a\nb\n', { plugins: [md009Rule] })
    expect(result.violations).toHaveLength(0)
  })
})

describe('md009Fixer', () => {
  it('removes trailing spaces from all lines', () => {
    expect(md009Fixer('hello   \nworld  \n')).toBe('hello\nworld\n')
  })

  it('preserves content without trailing spaces', () => {
    const clean = 'line one\nline two\n'
    expect(md009Fixer(clean)).toBe(clean)
  })

  it('handles CRLF line endings', () => {
    expect(md009Fixer('hello   \r\nworld\r\n')).toBe('hello\r\nworld\r\n')
  })

  it('handles empty string', () => {
    expect(md009Fixer('')).toBe('')
  })

  it('handles content with no newlines', () => {
    expect(md009Fixer('hello   ')).toBe('hello')
  })
})
