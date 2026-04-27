// @crackdown/core — Markdown lint pipeline

export const VERSION = '0.0.1'

export { lintString, lintFile } from './lint.js'
export { lint } from './api.js'
export { lintStringFix, lintFileFix } from './fix.js'
export { loadConfig, loadConfigFromFile, findConfigFile, CONFIG_FILENAME } from './config.js'
export type { MarkyConfig, RuleSeverity } from './config.js'
export type {
  LintResult,
  LintViolation,
  Severity,
  Plugin,
  PluginEntry,
  Fixer,
  FixResult,
} from './types.js'
export { md009Rule, md009Fixer } from './rules/md009.js'
export { md010Rule, md010Fixer } from './rules/md010.js'
export type { Md010FixerOptions } from './rules/md010.js'
