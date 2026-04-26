import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'
import { readFile } from 'node:fs/promises'
import type { LintResult, LintViolation, Plugin } from './types.js'

/**
 * Lint a Markdown string against the provided plugins.
 *
 * @param content - Raw Markdown content to lint.
 * @param plugins - Unified/remark plugins to apply as lint rules.
 * @param filename - Optional virtual filename for the result (default: "<string>").
 * @returns A LintResult with all violations found.
 */
export async function lintString(
  content: string,
  plugins: Plugin[],
  filename = '<string>',
): Promise<LintResult> {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkLint)

  for (const plugin of plugins) {
    processor.use(plugin)
  }

  const vfile = new VFile({ value: content, path: filename })
  const tree = processor.parse(vfile)
  await processor.run(tree, vfile)

  const violations: LintViolation[] = vfile.messages.map((msg) => ({
    ruleId:
      msg.source && msg.ruleId
        ? `${msg.source}:${msg.ruleId}`
        : String(msg.ruleId ?? msg.source ?? 'unknown'),
    message: msg.reason,
    line: msg.line ?? 1,
    column: msg.column ?? 1,
    severity: msg.fatal ? 'error' : 'warn',
  }))

  return { file: filename, violations }
}

/**
 * Lint a Markdown file on disk against the provided plugins.
 *
 * @param filePath - Absolute or relative path to the Markdown file.
 * @param plugins - Unified/remark plugins to apply as lint rules.
 * @returns A LintResult with all violations found.
 */
export async function lintFile(filePath: string, plugins: Plugin[]): Promise<LintResult> {
  const content = await readFile(filePath, 'utf8')
  return lintString(content, plugins, filePath)
}
