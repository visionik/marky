import { lintRule } from 'unified-lint-rule'
import type { Root, Heading, Text } from 'mdast'
import { visit } from 'unist-util-visit'

/** Characters considered trailing punctuation by MD026. */
const TRAILING_PUNCTUATION = /[.,;:!?]$/

/**
 * MD026 — Trailing punctuation in headings.
 *
 * Reports headings whose text content ends with punctuation (., ,, ;, :, !, ?).
 */
export const md026Rule = lintRule<Root, []>(
  { origin: 'marky:no-trailing-punctuation', url: undefined },
  (tree, file) => {
    visit(tree, 'heading', (node: Heading) => {
      const text = node.children
        .filter((c): c is Text => c.type === 'text')
        .map((c) => c.value)
        .join('')
        .trimEnd()

      if (TRAILING_PUNCTUATION.test(text)) {
        file.message(`MD026: Trailing punctuation in heading ('${text.slice(-1)}')`, node.position)
      }
    })
  },
)
