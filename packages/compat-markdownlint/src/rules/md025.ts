import { lintRule } from 'unified-lint-rule'
import type { Root, Heading } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD025 — Multiple top-level headings in the same document.
 *
 * Reports every H1 after the first one found.
 */
export const md025Rule = lintRule<Root, []>(
  { origin: 'crackdown:single-top-level-heading', url: undefined },
  (tree, file) => {
    let seen = false
    visit(tree, 'heading', (node: Heading) => {
      if (node.depth !== 1) return
      if (!seen) {
        seen = true
      } else {
        file.message('MD025: Multiple top-level headings — only one H1 per document', node.position)
      }
    })
  },
)
