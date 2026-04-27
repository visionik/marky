import { lintRule } from 'unified-lint-rule'
import type { Root, HTML } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD033 — Inline HTML should not be used.
 *
 * Reports any `html` node in the mdast (block-level HTML elements).
 */
export const md033Rule = lintRule<Root, []>(
  { origin: 'marky:no-inline-html', url: undefined },
  (tree, file) => {
    visit(tree, 'html', (node: HTML) => {
      file.message('MD033: Inline HTML should not be used', node.position)
    })
  },
)
