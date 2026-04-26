import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'

/**
 * MD041 — First line heading.
 *
 * Reports documents whose first non-empty block is not a heading.
 */
export const md041Rule = lintRule<Root, []>(
  { origin: 'remark-lint:first-heading-level', url: undefined },
  (tree, file) => {
    const first = tree.children.find((node) => node.type !== 'html')
    if (!first) return // empty document — no violation
    if (first.type !== 'heading') {
      file.message(
        'MD041: The first line of the document should be a top-level heading',
        first.position,
      )
    }
  },
)
