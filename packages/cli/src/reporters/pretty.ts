import chalk from 'chalk'
import type { LintResult, Severity } from '@marky/core'

const SEVERITY_ICON: Record<Severity, string> = {
  error: '✖',
  warn: '⚠',
}

function colorIcon(severity: Severity): string {
  const icon = SEVERITY_ICON[severity]
  return severity === 'error' ? chalk.red(icon) : chalk.yellow(icon)
}

/**
 * Format an array of {@link LintResult} as a human-readable terminal
 * report. Violations are grouped by file and indented under a filename
 * header; each violation line shows the location (`line:col`), a severity
 * icon, the rule identifier, and the message.
 *
 * The returned string is intended to be written directly to a TTY. Color
 * codes are emitted via `chalk` and will be stripped automatically when
 * the output is not a terminal.
 */
export function formatPretty(results: LintResult[]): string {
  const lines: string[] = []
  let totalErrors = 0
  let totalWarnings = 0

  for (const result of results) {
    if (result.violations.length === 0) continue
    lines.push(chalk.underline.cyan(result.file))
    for (const v of result.violations) {
      if (v.severity === 'error') totalErrors += 1
      else totalWarnings += 1
      const loc = chalk.gray(`${v.line}:${v.column}`)
      const icon = colorIcon(v.severity)
      const ruleId = chalk.gray(v.ruleId)
      lines.push(`  ${loc}  ${icon}  ${v.message}  ${ruleId}`)
    }
    lines.push('')
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    lines.push(chalk.green('✓ no problems found'))
  } else {
    const parts: string[] = []
    if (totalErrors > 0) {
      parts.push(chalk.red(`${totalErrors} error${totalErrors === 1 ? '' : 's'}`))
    }
    if (totalWarnings > 0) {
      parts.push(chalk.yellow(`${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}`))
    }
    lines.push(
      `${parts.join(', ')} across ${results.length} file${results.length === 1 ? '' : 's'}`,
    )
  }

  return lines.join('\n')
}
