import { lintRule } from 'unified-lint-rule'
import type { Root, List, ListItem } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD005 — Inconsistent indentation for list items at the same level.
 *
 * Checks that all direct `listItem` children of a `list` node start at
 * the same column. When remark parses well-formed Markdown, siblings are
 * always consistent; this rule catches edge cases in preprocessed input.
 */
export const md005Rule = lintRule<Root, []>(
  { origin: 'marky:list-indent-level', url: undefined },
  (tree, file) => {
    visit(tree, 'list', (listNode: List) => {
      const items = listNode.children as ListItem[]
      if (items.length < 2) return

      const firstCol = items[0]?.position?.start.column
      if (firstCol === undefined) return

      for (let i = 1; i < items.length; i++) {
        const col = items[i]?.position?.start.column
        if (col !== undefined && col !== firstCol) {
          file.message(
            `MD005: Inconsistent list item indentation at column ${col} (expected ${firstCol})`,
            items[i]?.position,
          )
        }
      }
    })
  },
)
