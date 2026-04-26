import { describe, it, expect } from 'vitest'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { lintResultToDiagnostics, violationToDiagnostic } from './convert.js'
import type { LintResult } from '@marky/core'

const EMPTY_RESULT: LintResult = { file: 'test.md', violations: [] }

describe('violationToDiagnostic', () => {
  it('maps line and column to 0-indexed LSP positions', () => {
    const diag = violationToDiagnostic({
      ruleId: 'marky:test',
      message: 'Test message',
      line: 3,
      column: 5,
      severity: 'warn',
    })
    expect(diag.range.start.line).toBe(2) // 1-indexed → 0-indexed
    expect(diag.range.start.character).toBe(4)
    expect(diag.range.end.line).toBe(2)
    expect(diag.range.end.character).toBe(4)
  })

  it('maps severity "error" to DiagnosticSeverity.Error', () => {
    const diag = violationToDiagnostic({
      ruleId: 'marky:test',
      message: 'error',
      line: 1,
      column: 1,
      severity: 'error',
    })
    expect(diag.severity).toBe(DiagnosticSeverity.Error)
  })

  it('maps severity "warn" to DiagnosticSeverity.Warning', () => {
    const diag = violationToDiagnostic({
      ruleId: 'marky:test',
      message: 'warn',
      line: 1,
      column: 1,
      severity: 'warn',
    })
    expect(diag.severity).toBe(DiagnosticSeverity.Warning)
  })

  it('uses ruleId as the diagnostic source', () => {
    const diag = violationToDiagnostic({
      ruleId: 'marky:no-trailing-spaces',
      message: 'test',
      line: 1,
      column: 1,
      severity: 'warn',
    })
    expect(diag.source).toBe('marky:no-trailing-spaces')
  })

  it('uses message as the diagnostic message', () => {
    const diag = violationToDiagnostic({
      ruleId: 'x',
      message: 'Heading contains FAIL',
      line: 1,
      column: 1,
      severity: 'warn',
    })
    expect(diag.message).toBe('Heading contains FAIL')
  })
})

describe('lintResultToDiagnostics', () => {
  it('returns an empty array for a clean result', () => {
    expect(lintResultToDiagnostics(EMPTY_RESULT)).toHaveLength(0)
  })

  it('returns one diagnostic per violation', () => {
    const result: LintResult = {
      file: 'a.md',
      violations: [
        { ruleId: 'a', message: 'm1', line: 1, column: 1, severity: 'warn' },
        { ruleId: 'b', message: 'm2', line: 2, column: 3, severity: 'error' },
      ],
    }
    const diags = lintResultToDiagnostics(result)
    expect(diags).toHaveLength(2)
    expect(diags[0]?.severity).toBe(DiagnosticSeverity.Warning)
    expect(diags[1]?.severity).toBe(DiagnosticSeverity.Error)
  })
})
