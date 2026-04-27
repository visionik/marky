import { lintRule } from 'unified-lint-rule'
import type { Root, List, ListItem } from 'mdast'

export interface Md007Options {
  /** Number of spaces per nesting level (default: 2). */
  indent?: number
}

/**
 * MD007 — Unordered list indentation.
 *
 * Each level of nesting in an unordered list should increment by exactly
 * `indent` spaces (default: 2). Ordered lists are not checked.
 */
export const md007Rule = lintRule<Root, Md007Options>(
  { origin: 'crackdown:unordered-list-indent', url: undefined },
  (tree, file, options) => {
    const expected = options?.indent ?? 2

    // Recursive walk — file is captured from the outer callback so no
    // helper parameter type incompatibility arises.
    const walkList = (listNode: List, parentColumn: number | null): void => {
      for (const item of listNode.children as ListItem[]) {
        const itemCol = item.position?.start.column ?? 1

        if (parentColumn !== null) {
          const actualIndent = itemCol - parentColumn
          if (actualIndent !== expected) {
            file.message(
              `MD007: Unordered list item indented by ${actualIndent} (expected ${expected})`,
              item.position,
            )
          }
        }

        // Recurse into nested unordered lists
        for (const child of item.children) {
          if (child.type === 'list' && !(child as List).ordered) {
            walkList(child as List, itemCol)
          }
        }
      }
    }

    for (const node of tree.children) {
      if (node.type === 'list' && !(node as List).ordered) {
        walkList(node as List, null)
      }
    }
  },
)
