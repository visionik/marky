import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md047Rule, md047Fixer } from './md047.js'

describe('md047Rule — file should end with a single newline', () => {
  it('produces no violations when content ends with a newline', async () => {
    const result = await lintString('# Hello\n', { plugins: [md047Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when content does not end with a newline', async () => {
    const result = await lintString('# Hello', { plugins: [md047Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md047|newline/)
  })

  it('reports a violation for an empty string without newline', async () => {
    // An empty string has no newline — violates MD047
    const result = await lintString('no newline here', { plugins: [md047Rule] })
    expect(result.violations).toHaveLength(1)
  })

  it('produces no violations for a document ending with multiple lines', async () => {
    const result = await lintString('# H\n\nParagraph.\n', { plugins: [md047Rule] })
    expect(result.violations).toHaveLength(0)
  })
})

describe('md047Fixer', () => {
  it('appends a newline when missing', () => {
    expect(md047Fixer('no newline')).toBe('no newline\n')
  })

  it('does not add a second newline when one already exists', () => {
    expect(md047Fixer('has newline\n')).toBe('has newline\n')
  })

  it('handles empty string — adds a newline', () => {
    expect(md047Fixer('')).toBe('\n')
  })
})
