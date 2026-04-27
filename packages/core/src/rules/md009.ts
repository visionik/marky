import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'
import type { Fixer } from '../types.js'

/**
 * MD009 — No trailing spaces.
 *
 * Reports lines that contain one or more trailing space characters.
 * Use {@link md009Fixer} to automatically strip trailing spaces.
 */
export const md009Rule = lintRule<Root, []>(
  { origin: 'crackdown:no-trailing-spaces', url: undefined },
  (_tree, file) => {
    const lines = String(file).split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line !== line.trimEnd()) {
        file.message('MD009: Trailing spaces found', {
          line: index + 1,
          column: line.trimEnd().length + 1,
        })
      }
    })
  },
)

/**
 * MD009 auto-fixer.
 *
 * Strips trailing whitespace from every line while preserving line endings.
 * Safe to use as a {@link Fixer} in `MarkyConfig.fixers`.
 */
export const md009Fixer: Fixer = (content) => content.replace(/[^\S\r\n]+(?=\r?\n|$)/g, '')
