import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'
import type { Fixer } from '@crackdown/core'

export interface Md012Options {
  /** Maximum number of consecutive blank lines allowed (default: 1). */
  maximum?: number
}

/**
 * MD012 — Multiple consecutive blank lines.
 *
 * Reports runs of blank lines that exceed `maximum` (default: 1).
 * Use {@link md012Fixer} to automatically collapse excess blank lines.
 */
export const md012Rule = lintRule<Root, Md012Options>(
  { origin: 'crackdown:no-multiple-blanks', url: undefined },
  (_tree, file, options) => {
    const max = options?.maximum ?? 1
    const lines = String(file).split(/\r?\n/)
    let blankRun = 0
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        blankRun++
        if (blankRun > max) {
          file.message(`MD012: ${blankRun} consecutive blank lines (maximum: ${max})`, {
            line: index + 1,
            column: 1,
          })
        }
      } else {
        blankRun = 0
      }
    })
  },
)

/**
 * MD012 auto-fixer.
 *
 * Collapses any run of 2+ consecutive blank lines to a single blank line.
 */
export const md012Fixer: Fixer = (content) => content.replace(/\n{3,}/g, '\n\n')
