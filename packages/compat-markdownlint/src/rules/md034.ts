import { lintRule } from 'unified-lint-rule'
import type { Root, Link } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD034 — Bare URL used.
 *
 * Reports URLs that appear as plain text in a paragraph rather than being
 * wrapped in `<url>` angle-bracket syntax or a proper `[text](url)` link.
 *
 * With remark-gfm enabled, bare URLs are automatically parsed into `link`
 * nodes. We identify them by checking whether the source character at the
 * link's start position is `[` (explicit link) or `<` (angle-bracket
 * autolink). Any other character means it was a bare URL in the source.
 */
export const md034Rule = lintRule<Root, []>(
  { origin: 'marky:no-bare-urls', url: undefined },
  (tree, file) => {
    const sourceLines = String(file).split(/\r?\n/)

    visit(tree, 'link', (node: Link) => {
      const startLine = node.position?.start.line
      const startCol = node.position?.start.column
      if (startLine === undefined || startCol === undefined) return

      const line = sourceLines[startLine - 1] ?? ''
      const char = line[startCol - 1] ?? ''

      // Explicit [text](url) links start with '['.
      // Angle-bracket autolinks start with '<'.
      // Anything else is a bare URL (GFM autolink from plain text).
      if (char !== '[' && char !== '<') {
        file.message(
          `MD034: Bare URL — wrap in angle brackets (<${node.url}>) or use [text](url) syntax`,
          node.position,
        )
      }
    })
  },
)
