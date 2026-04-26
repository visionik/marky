import { readFile } from 'node:fs/promises'
import type { MarkyConfig } from './config.js'
import type { FixResult } from './types.js'
import { lintString } from './lint.js'

/**
 * Lint a Markdown string and apply all fixers from `config.fixers`.
 *
 * Runs the lint pipeline twice: once on the original content to count
 * pre-fix violations, and once on the fixed content to surface any
 * violations that the fixers could not resolve.
 *
 * @param content - Raw Markdown content to lint and fix.
 * @param config - Configuration including plugins and fixers. Defaults to `{}`.
 * @param filename - Optional virtual filename (default: `"<string>"`).
 * @returns A {@link FixResult} with the corrected content, remaining violations,
 *   and a count of violations resolved by the fixers.
 */
export async function lintStringFix(
  content: string,
  config: MarkyConfig = {},
  filename = '<string>',
): Promise<FixResult> {
  const fixers = config.fixers ?? []

  // Lint the original content to establish a baseline violation count.
  const original = await lintString(content, config, filename)

  // Apply fixers sequentially.
  let fixed = content
  for (const fixer of fixers) {
    fixed = fixer(fixed)
  }

  // Re-lint the fixed content to surface any remaining violations.
  const remaining = await lintString(fixed, config, filename)

  return {
    file: filename,
    violations: remaining.violations,
    fixed,
    fixedCount: original.violations.length - remaining.violations.length,
  }
}

/**
 * Lint a Markdown file on disk and apply all fixers from `config.fixers`.
 *
 * This function is **read-only** — it does not write the fixed content back
 * to disk. Callers (e.g. the CLI `--fix` command) are responsible for
 * writing `result.fixed` back to the file if desired.
 *
 * @param filePath - Absolute or relative path to the Markdown file.
 * @param config - Configuration including plugins and fixers. Defaults to `{}`.
 * @returns A {@link FixResult} with the corrected content and remaining violations.
 */
export async function lintFileFix(filePath: string, config: MarkyConfig = {}): Promise<FixResult> {
  const content = await readFile(filePath, 'utf8')
  return lintStringFix(content, config, filePath)
}
