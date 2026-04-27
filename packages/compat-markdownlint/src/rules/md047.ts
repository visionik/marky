import { lintRule } from 'unified-lint-rule'
import type { Root } from 'mdast'
import type { Fixer } from '@crackdown/core'

/**
 * MD047 — Files should end with a single newline character.
 *
 * Use {@link md047Fixer} to automatically append a trailing newline.
 */
export const md047Rule = lintRule<Root, []>(
  { origin: 'crackdown:single-trailing-newline', url: undefined },
  (_tree, file) => {
    const content = String(file)
    if (content.length > 0 && !content.endsWith('\n')) {
      const lines = content.split('\n')
      file.message('MD047: File should end with a single newline character', {
        line: lines.length,
        column: (lines[lines.length - 1]?.length ?? 0) + 1,
      })
    }
  },
)

/**
 * MD047 auto-fixer.
 *
 * Appends a trailing newline if the content does not already end with one.
 */
export const md047Fixer: Fixer = (content) => (content.endsWith('\n') ? content : content + '\n')
