// @marky/core — Markdown lint pipeline

export const VERSION = '0.0.1'

export { lintString, lintFile } from './lint.js'
export { lint } from './api.js'
export { loadConfig, loadConfigFromFile, findConfigFile, CONFIG_FILENAME } from './config.js'
export type { MarkyConfig, RuleSeverity } from './config.js'
export type { LintResult, LintViolation, Severity, Plugin, PluginEntry } from './types.js'
