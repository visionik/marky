// @marky/lsp — LSP server for the marky Markdown linter

export { createServer } from './server.js'
export { validateMarkdown, workspaceRootFromUri } from './validate.js'
export { lintResultToDiagnostics, violationToDiagnostic } from './convert.js'
