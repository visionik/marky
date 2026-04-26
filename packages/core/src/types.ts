import type { Plugin as UnifiedPlugin } from 'unified'

/** Severity level of a lint violation. */
export type Severity = 'error' | 'warn'

/** A single lint violation reported against a Markdown file. */
export interface LintViolation {
  /** Rule identifier, e.g. "remark-lint:no-heading-punctuation" */
  ruleId: string
  /** Human-readable description of the violation. */
  message: string
  /** 1-based line number. */
  line: number
  /** 1-based column number. */
  column: number
  /** Severity of the violation. */
  severity: Severity
}

/** The result of linting a single file or string. */
export interface LintResult {
  /** File path, or a virtual name for string input (e.g. "<stdin>"). */
  file: string
  /** All violations found. Empty array means no issues. */
  violations: LintViolation[]
}

/** A unified/remark plugin that can be used as a marky lint rule. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Plugin = UnifiedPlugin<any[], any>
