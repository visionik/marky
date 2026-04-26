// @marky/core — Markdown lint pipeline

export const VERSION = '0.0.1'

export { lintString, lintFile } from './lint.js'
export type { LintResult, LintViolation, Severity, Plugin } from './types.js'
