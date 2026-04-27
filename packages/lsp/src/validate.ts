import { type Diagnostic } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { dirname } from 'node:path'
import { lintString, type MarkyConfig } from '@crackdown/core'
import { lintResultToDiagnostics } from './convert.js'

/**
 * Lint Markdown content and return LSP diagnostics.
 *
 * @param content - The raw Markdown text (e.g. from a TextDocument).
 * @param uri - The LSP document URI (e.g. `file:///path/to/file.md`).
 * @param config - The resolved {@link MarkyConfig} to use for linting.
 *   When called from the server, this is loaded once per workspace root and
 *   refreshed when `crackdown.config.ts` changes.
 * @returns An array of LSP {@link Diagnostic} objects ready to publish.
 */
export async function validateMarkdown(
  content: string,
  uri: string,
  config: MarkyConfig,
): Promise<Diagnostic[]> {
  // Derive a human-readable filename from the URI for marky's LintResult.
  const fsPath = URI.parse(uri).fsPath ?? uri
  const result = await lintString(content, config, fsPath)
  return lintResultToDiagnostics(result)
}

/**
 * Resolve the workspace root from a document URI.
 * Used to find `crackdown.config.ts` via `loadConfig`.
 */
export function workspaceRootFromUri(uri: string): string {
  try {
    return dirname(URI.parse(uri).fsPath)
  } catch {
    return '.'
  }
}
