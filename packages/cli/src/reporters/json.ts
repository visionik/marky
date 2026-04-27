import type { LintResult } from '@crackdown/core'

/**
 * Format an array of {@link LintResult} as a pretty-printed JSON string.
 *
 * The output is a JSON array containing one object per input file with the
 * shape `{ file: string, violations: LintViolation[] }`. The string does
 * not include a trailing newline; the caller should add one if writing to
 * a stream.
 */
export function formatJson(results: LintResult[]): string {
  return JSON.stringify(results, null, 2)
}
