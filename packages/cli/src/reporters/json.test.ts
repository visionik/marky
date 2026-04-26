import { describe, it, expect } from 'vitest'
import { formatJson } from './json.js'
import type { LintResult } from '@marky/core'

const sample: LintResult[] = [
  {
    file: 'a.md',
    violations: [
      {
        ruleId: 'remark-lint:rule-a',
        message: 'msg A',
        line: 1,
        column: 1,
        severity: 'error',
      },
    ],
  },
  { file: 'b.md', violations: [] },
]

describe('formatJson', () => {
  it('round-trips an array of LintResult through JSON.parse', () => {
    const out = formatJson(sample)
    const parsed = JSON.parse(out) as LintResult[]
    expect(parsed).toEqual(sample)
  })

  it('returns a JSON array', () => {
    const out = formatJson(sample)
    expect(out.trimStart().startsWith('[')).toBe(true)
    expect(out.trimEnd().endsWith(']')).toBe(true)
  })

  it('returns "[]" for an empty results array', () => {
    expect(formatJson([])).toBe('[]')
  })
})
