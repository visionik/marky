import { lintRule } from 'unified-lint-rule'
import type { Root, Heading, Text } from 'mdast'
import { visit } from 'unist-util-visit'

/** Extract all text content from a heading node. */
function headingText(node: Heading): string {
  return node.children
    .filter((c): c is Text => c.type === 'text')
    .map((c) => c.value)
    .join('')
}

/**
 * MD024 — Multiple headings with the same content.
 *
 * Reports any heading whose text has already appeared earlier in the document.
 * Comparison is case-sensitive (e.g. "Overview" and "overview" are distinct).
 */
export const md024Rule = lintRule<Root, []>(
  { origin: 'marky:no-duplicate-headings', url: undefined },
  (tree, file) => {
    const seen = new Set<string>()

    visit(tree, 'heading', (node: Heading) => {
      const text = headingText(node)
      if (seen.has(text)) {
        file.message(`MD024: Duplicate heading — "${text}" appears more than once`, node.position)
      } else {
        seen.add(text)
      }
    })
  },
)
