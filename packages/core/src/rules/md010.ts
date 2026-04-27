import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'

export interface Md010FixerOptions {
  /** Number of spaces to replace each tab with (default: 4). */
  tabSize?: number
}

/**
 * MD010 — No hard tabs.
 *
 * Reports lines that contain hard tab characters (`\t`).
 * Use {@link md010Fixer} to automatically replace tabs with spaces.
 */
export const md010Rule = lintRule<Root, []>(
  { origin: 'crackdown:no-hard-tabs', url: undefined },
  (_tree, file) => {
    const lines = String(file).split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.includes('\t')) {
        file.message('MD010: Hard tabs found', {
          line: index + 1,
          column: line.indexOf('\t') + 1,
        })
      }
    })
  },
)

/**
 * MD010 auto-fixer factory.
 *
 * Replaces every hard tab (`\t`) with `tabSize` spaces (default: 4).
 * Returns a {@link Fixer}-compatible function for use in `MarkyConfig.fixers`.
 *
 * @example
 * // In crackdown.config.ts
 * import { md010Fixer } from '@crackdown/core'
 * export default { fixers: [md010Fixer] }
 *
 * // With custom tab size
 * export default { fixers: [(c) => md010Fixer(c, { tabSize: 2 })] }
 */
export function md010Fixer(content: string, options?: Md010FixerOptions): string {
  const spaces = ' '.repeat(options?.tabSize ?? 4)
  return content.replace(/\t/g, spaces)
}
