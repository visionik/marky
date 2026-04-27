import { lintRule } from 'unified-lint-rule'
import type { Root, Code } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * MD040 — Fenced code blocks should have a language specified.
 *
 * Reports fenced code blocks (```) that have no `lang` attribute.
 * Indented code blocks are not flagged.
 */
export const md040Rule = lintRule<Root, []>(
  { origin: 'marky:fenced-code-language', url: undefined },
  (tree, file) => {
    const sourceLines = String(file).split(/\r?\n/)
    visit(tree, 'code', (node: Code) => {
      // Both fenced (no-lang) and indented blocks have lang = null in the AST.
      // Distinguish by checking whether the source line starts with a fence char.
      const startLine = sourceLines[(node.position?.start.line ?? 1) - 1] ?? ''
      const isFenced = startLine.startsWith('`') || startLine.startsWith('~')
      if (isFenced && !node.lang) {
        file.message('MD040: Fenced code block should have a language specifier', node.position)
      }
    })
  },
)
