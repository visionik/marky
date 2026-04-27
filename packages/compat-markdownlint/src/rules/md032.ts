import { lintRule } from 'unified-lint-rule'
import type { Root, RootContent } from 'mdast'

/**
 * MD032 — Lists should be surrounded by blank lines.
 */
export const md032Rule = lintRule<Root, []>(
  { origin: 'marky:blanks-around-lists', url: undefined },
  (tree, file) => {
    const children = tree.children
    children.forEach((node: RootContent, index: number) => {
      if (node.type !== 'list') return
      const pos = node.position
      if (!pos) return

      // Check blank line BEFORE (unless first node)
      if (index > 0) {
        const prev = children[index - 1]
        const prevEnd = prev?.position?.end?.line ?? 0
        const nodeStart = pos.start.line
        if (nodeStart - prevEnd < 2) {
          file.message('MD032: List should be preceded by a blank line', pos)
          return
        }
      }

      // Check blank line AFTER (unless last node)
      if (index < children.length - 1) {
        const next = children[index + 1]
        const nodeEnd = pos.end.line
        const nextStart = next?.position?.start?.line ?? nodeEnd + 2
        if (nextStart - nodeEnd < 2) {
          file.message('MD032: List should be followed by a blank line', pos)
        }
      }
    })
  },
)
