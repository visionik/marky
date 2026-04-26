import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'

export interface Md013Options {
  /** Maximum allowed line length (default: 80). */
  lineLength?: number
}

/**
 * MD013 — Line length.
 *
 * Reports lines that exceed `lineLength` characters (default: 80).
 * Implemented as a raw source scan so it catches all content types
 * (headings, paragraphs, code blocks, etc.) without AST traversal.
 */
export const md013Rule = lintRule<Root, Md013Options>(
  { origin: 'remark-lint:maximum-line-length', url: undefined },
  (tree, file, options) => {
    const limit = options?.lineLength ?? 80
    const lines = String(file).split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.length > limit) {
        file.message(`Line length of ${line.length} exceeds the limit of ${limit}`, {
          line: index + 1,
          column: limit + 1,
        })
      }
    })
  },
)
