import { lintFile } from './lint.js'
import type { MarkyConfig } from './config.js'
import type { LintResult } from './types.js'

/**
 * Lint a list of Markdown files from disk.
 *
 * Each entry in the returned array corresponds positionally to the input
 * `files` array. Files are linted sequentially so the result order is
 * deterministic and any read errors surface predictably.
 *
 * @param files - Paths to Markdown files to lint. May be absolute or
 *   relative to the current working directory.
 * @param config - Optional {@link MarkyConfig}. Defaults to `{}`.
 * @returns A {@link LintResult} for each input file, in input order.
 */
export async function lint(files: string[], config: MarkyConfig = {}): Promise<LintResult[]> {
  const results: LintResult[] = []
  for (const file of files) {
    results.push(await lintFile(file, config))
  }
  return results
}
