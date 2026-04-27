import { lintFile } from './lint.js'
import type { MarkyConfig } from './config.js'
import type { LintResult } from './types.js'

/**
 * Lint a list of Markdown files from disk with bounded concurrency.
 *
 * Files are linted up to `concurrency` at a time (default: 16). This
 * provides I/O parallelism without exhausting the OS file-descriptor limit
 * or causing memory spikes on large repos. Results are returned in the
 * same order as the input `files` array regardless of completion order.
 *
 * @param files - Paths to Markdown files to lint.
 * @param config - Optional {@link MarkyConfig}. Defaults to `{}`.
 * @param concurrency - Max simultaneous file reads (default: 16).
 * @returns A {@link LintResult} for each input file, in input order.
 */
export async function lint(
  files: string[],
  config: MarkyConfig = {},
  concurrency = 16,
): Promise<LintResult[]> {
  const results = new Array<LintResult>(files.length)

  // Run `concurrency` workers in parallel; each pulls the next file off the
  // shared index until all files are processed.
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, async () => {
      while (next < files.length) {
        const i = next++
        results[i] = await lintFile(files[i]!, config)
      }
    }),
  )

  return results
}
