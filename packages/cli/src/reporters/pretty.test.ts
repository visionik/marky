import { describe, it, expect, beforeAll } from 'vitest'
import chalk from 'chalk'
import { formatPretty } from './pretty.js'
import type { LintResult } from '@crackdown/core'

beforeAll(() => {
  // Force chalk to emit ANSI codes regardless of TTY/CI detection so we
  // can assert on color output deterministically. Level 1 = basic 16
  // colors which is enough for our assertions.
  chalk.level = 1
})

const withMixed: LintResult[] = [
  {
    file: 'docs/intro.md',
    violations: [
      {
        ruleId: 'remark-lint:no-heading-punctuation',
        message: 'Heading ends with !',
        line: 1,
        column: 7,
        severity: 'error',
      },
      {
        ruleId: 'crackdown:mermaid-syntax',
        message: 'Bad mermaid block',
        line: 12,
        column: 1,
        severity: 'warn',
      },
    ],
  },
  { file: 'docs/clean.md', violations: [] },
]

describe('formatPretty', () => {
  it('groups violations by file with the filename as a header', () => {
    const out = formatPretty(withMixed)
    expect(out).toContain('docs/intro.md')
    expect(out).not.toContain('docs/clean.md')
  })

  it('includes line:col, rule id, and message for each violation', () => {
    const out = formatPretty(withMixed)
    expect(out).toContain('1:7')
    expect(out).toContain('remark-lint:no-heading-punctuation')
    expect(out).toContain('Heading ends with !')
    expect(out).toContain('12:1')
    expect(out).toContain('crackdown:mermaid-syntax')
    expect(out).toContain('Bad mermaid block')
  })

  it('renders a red icon for errors and a yellow icon for warnings', () => {
    const out = formatPretty(withMixed)
    // chalk.red('✖') wraps the codepoint; assert the codepoint is present
    // and that the line containing it also includes the red ANSI code.
    expect(out).toContain('✖')
    expect(out).toContain('⚠')
    const errorLine = out.split('\n').find((l) => l.includes('Heading ends with !'))
    expect(errorLine).toBeDefined()
    // chalk level 1 uses \u001b[31m for red, \u001b[33m for yellow.
    expect(errorLine).toMatch(/\u001b\[31m/)
    const warnLine = out.split('\n').find((l) => l.includes('Bad mermaid block'))
    expect(warnLine).toMatch(/\u001b\[33m/)
  })

  it('reports a clean message when no violations are present', () => {
    const out = formatPretty([{ file: 'a.md', violations: [] }])
    expect(out).toContain('no problems found')
  })

  it('summarizes total errors and warnings across all files', () => {
    const out = formatPretty(withMixed)
    expect(out).toContain('1 error')
    expect(out).toContain('1 warning')
  })

  it('pluralizes error/warning counts correctly', () => {
    const many: LintResult[] = [
      {
        file: 'a.md',
        violations: [
          {
            ruleId: 'r:1',
            message: 'm1',
            line: 1,
            column: 1,
            severity: 'error',
          },
          {
            ruleId: 'r:2',
            message: 'm2',
            line: 2,
            column: 2,
            severity: 'error',
          },
          {
            ruleId: 'r:3',
            message: 'm3',
            line: 3,
            column: 3,
            severity: 'warn',
          },
          {
            ruleId: 'r:4',
            message: 'm4',
            line: 4,
            column: 4,
            severity: 'warn',
          },
        ],
      },
    ]
    const out = formatPretty(many)
    expect(out).toContain('2 errors')
    expect(out).toContain('2 warnings')
    expect(out).toContain('1 file')
  })
})
