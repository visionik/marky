import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import type { LintResult, LintViolation } from '@crackdown/core'

/**
 * Convert a single crackdown {@link LintViolation} to an LSP {@link Diagnostic}.
 *
 * crackdown uses 1-based line/column; LSP uses 0-based character positions.
 */
export function violationToDiagnostic(violation: LintViolation): Diagnostic {
  const line = Math.max(0, violation.line - 1)
  const character = Math.max(0, violation.column - 1)

  return {
    severity:
      violation.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    range: {
      start: { line, character },
      end: { line, character },
    },
    message: violation.message,
    source: violation.ruleId,
  }
}

/**
 * Convert all violations in a {@link LintResult} to LSP {@link Diagnostic}s.
 */
export function lintResultToDiagnostics(result: LintResult): Diagnostic[] {
  return result.violations.map(violationToDiagnostic)
}
