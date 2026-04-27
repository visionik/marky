import { lintRule } from 'unified-lint-rule'
import type { Root, RootContent } from 'mdast'

/**
 * MD022 — Headings should be surrounded by blank lines.
 *
 * Reports headings that are not preceded or followed by a blank line,
 * unless they are at the very start or end of the document.
 *
 * Note: remark-parse collapses adjacent non-blank lines into a single AST
 * node, so the check is based on source position gaps between siblings.
 */
export const md022Rule = lintRule<Root, []>(
  { origin: 'crackdown:blanks-around-headings', url: undefined },
  (tree, file) => {
    const children = tree.children
    const source = String(file)
    const lines = source.split(/\r?\n/)

    children.forEach((node: RootContent, index: number) => {
      if (node.type !== 'heading') return

      const pos = node.position
      if (!pos) return

      // Check blank line BEFORE (unless first node)
      if (index > 0) {
        const prev = children[index - 1]
        const prevEnd = prev?.position?.end?.line ?? 0
        const headingStart = pos.start.line
        // There must be at least one blank line between the previous node and this heading.
        const linesBetween = headingStart - prevEnd - 1
        if (linesBetween < 1) {
          // Verify the gap line is actually blank
          const gapLine = lines[headingStart - 2] ?? ''
          if (gapLine.trim() !== '') {
            file.message('MD022: Heading should be preceded by a blank line', pos)
            return
          }
        }
      }

      // Check blank line AFTER (unless last node)
      if (index < children.length - 1) {
        const next = children[index + 1]
        const headingEnd = pos.end.line
        const nextStart = next?.position?.start?.line ?? headingEnd + 2
        const linesBetween = nextStart - headingEnd - 1
        if (linesBetween < 1) {
          const gapLine = lines[headingEnd] ?? ''
          if (gapLine.trim() !== '') {
            file.message('MD022: Heading should be followed by a blank line', pos)
          }
        }
      }
    })
  },
)
