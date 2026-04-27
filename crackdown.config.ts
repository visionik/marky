/**
 * marky configuration for the marky project itself.
 * Runs on every Markdown file in the repository.
 */
import {
  md009Rule, md009Fixer,
  md010Rule, md010Fixer,
} from '@crackdown/core'
import {
  md012Rule, md012Fixer,
  md025Rule,
  md031Rule,
  md040Rule,
  md041Rule,
  md047Rule, md047Fixer,
} from '@crackdown/compat-markdownlint'
import type { MarkyConfig } from '@crackdown/core'

const config: MarkyConfig = {
  plugins: [
    md009Rule,  // no trailing spaces
    md010Rule,  // no hard tabs
    md012Rule,  // no multiple consecutive blank lines
    // md022Rule — too strict for Keep-a-Changelog format (#### heading\n- item)
    // md024Rule — changelogs legitimately repeat 'Added', 'Fixed' etc.
    md025Rule,  // single top-level heading
    md031Rule,  // blank lines around fenced code blocks
    md040Rule,  // fenced code blocks have a language
    md041Rule,  // first line is a heading
    md047Rule,  // file ends with a newline
  ],
  fixers: [
    md009Fixer, // strip trailing spaces
    md010Fixer, // replace tabs with spaces
    md012Fixer, // collapse multiple blank lines
    md047Fixer, // append trailing newline
  ],
}

export default config
