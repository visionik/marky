/**
 * Example marky configuration.
 *
 * marky walks up from the current working directory until it finds a
 * `marky.config.ts` file. The default export must conform to the
 * `MarkyConfig` interface exported from `@marky/core`.
 *
 * Both fields below are optional. Delete or comment out anything you
 * don't need.
 */
import type { MarkyConfig } from '@marky/core'

const config: MarkyConfig = {
  /**
   * Map of rule identifiers to severity. Identifiers use the form
   * `<source>:<rule-id>` (e.g. `remark-lint:no-heading-punctuation`).
   *
   *   'error' — fail the lint (CLI exits 1)
   *   'warn'  — report but don't fail
   *   'off'   — disable a rule that a plugin would otherwise enable
   */
  rules: {
    // 'remark-lint:no-heading-punctuation': 'error',
    // 'remark-lint:no-multiple-toplevel-headings': 'warn',
  },

  /**
   * Unified/remark plugins to apply as additional lint rules. Plugins run
   * after the built-in remark-parse / remark-gfm / remark-lint steps.
   *
   * Example:
   *   import remarkLintNoDeadUrls from 'remark-lint-no-dead-urls'
   *   plugins: [remarkLintNoDeadUrls],
   */
  plugins: [],
}

export default config
