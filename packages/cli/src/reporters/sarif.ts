import { relative, isAbsolute } from 'node:path'
import type { LintResult, LintViolation } from '@crackdown/core'

/** SARIF severity level mapping. */
function sarifLevel(severity: LintViolation['severity']): 'error' | 'warning' | 'note' {
  return severity === 'error' ? 'error' : 'warning'
}

/**
 * Convert a file path to a SARIF artifact URI.
 * When `repoRoot` is provided, returns a path relative to the repo root
 * (what GitHub Code Scanning expects). Falls back to the absolute path.
 */
function toUri(filePath: string, repoRoot?: string): string {
  if (repoRoot && isAbsolute(filePath)) {
    return relative(repoRoot, filePath)
  }
  return filePath
}

/**
 * Format lint results as a SARIF 2.1.0 JSON string.
 *
 * Suitable for upload to GitHub Code Scanning via
 * `github/codeql-action/upload-sarif@v3`.
 *
 * @param results - Lint results from `lint()` or `lintString()`.
 * @param repoRoot - Absolute path to the repository root. When provided,
 *   file URIs are made relative so GitHub can resolve them to source lines.
 */
export function formatSarif(results: LintResult[], repoRoot?: string): string {
  const sarifResults = results.flatMap((r) =>
    r.violations.map((v) => ({
      ruleId: v.ruleId,
      level: sarifLevel(v.severity),
      message: { text: v.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: toUri(r.file, repoRoot),
              uriBaseId: repoRoot ? '%SRCROOT%' : undefined,
            },
            region: {
              startLine: v.line,
              startColumn: v.column,
            },
          },
        },
      ],
    })),
  )

  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'crackdown',
              informationUri: 'https://visionik.github.io/crackdown/',
              rules: [],
            },
          },
          results: sarifResults,
        },
      ],
    },
    null,
    2,
  )
}
