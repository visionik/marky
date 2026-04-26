// @marky/compat-markdownlint — markdownlint compatibility layer

export const COMPAT_VERSION = '0.0.1'

export { loadMarkdownlintConfig } from './compat.js'
export type { CompatConfig } from './compat.js'
export { md013Rule } from './rules/md013.js'
export type { Md013Options } from './rules/md013.js'
export { md041Rule } from './rules/md041.js'
