import { lintRule } from 'unified-lint-rule'
import type { Root, Heading } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD001 — Heading levels should only increment by one level at a time.
 *
 * Reports when a heading jumps more than one level (e.g. H1 → H3).
 * Decreasing levels (H3 → H1) are permitted.
 */
export const md001Rule = lintRule<Root, []>(
  { origin: 'crackdown:heading-increment', url: undefined },
  (tree, file) => {
    const levels: number[] = []

    visit(tree, 'heading', (node: Heading) => {
      const current = node.depth
      if (levels.length > 0) {
        const previous = levels[levels.length - 1]
        if (previous !== undefined && current > previous + 1) {
          file.message(
            `MD001: Heading level jumped from H${previous} to H${current} (should increment by 1)`,
            node.position,
          )
        }
      }
      levels.push(current)
    })
  },
)
