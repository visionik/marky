import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'
import { readFile } from 'node:fs/promises'
import type { MarkyConfig, RuleSeverity } from './config.js'
import type { LintResult, LintViolation, Plugin } from './types.js'

function applyRuleConfig(
  violations: LintViolation[],
  rules: Record<string, RuleSeverity> | undefined,
): LintViolation[] {
  if (!rules) return violations
  const out: LintViolation[] = []
  for (const v of violations) {
    const configured = rules[v.ruleId]
    if (configured === 'off') continue
    if (configured === 'error' || configured === 'warn') {
      out.push({ ...v, severity: configured })
    } else {
      out.push(v)
    }
  }
  return out
}

/**
 * Lint a Markdown string using the provided {@link MarkyConfig}.
 *
 * Plugins from `config.plugins` are applied as remark lint rules. Any
 * rule severities declared in `config.rules` override the default
 * severity reported by the underlying plugin (or disable the rule
 * entirely when set to `'off'`).
 *
 * @param content - Raw Markdown content to lint.
 * @param config - Optional configuration. Defaults to `{}`.
 * @param filename - Optional virtual filename for the result
 *   (default: `"<string>"`).
 * @returns A {@link LintResult} containing all reported violations.
 */
export async function lintString(
  content: string,
  config: MarkyConfig = {},
  filename = '<string>',
): Promise<LintResult> {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkLint)

  for (const entry of config.plugins ?? []) {
    if (Array.isArray(entry)) {
      const [plugin, ...args] = entry as [Plugin, ...unknown[]]
      processor.use(plugin, ...args)
    } else {
      processor.use(entry)
    }
  }

  const vfile = new VFile({ value: content, path: filename })
  const tree = processor.parse(vfile)
  await processor.run(tree, vfile)

  const rawViolations: LintViolation[] = vfile.messages.map((msg) => ({
    ruleId:
      msg.source && msg.ruleId
        ? `${msg.source}:${msg.ruleId}`
        : String(msg.ruleId ?? msg.source ?? 'unknown'),
    message: msg.reason,
    line: msg.line ?? 1,
    column: msg.column ?? 1,
    severity: msg.fatal ? 'error' : 'warn',
  }))

  return {
    file: filename,
    violations: applyRuleConfig(rawViolations, config.rules),
  }
}

/**
 * Lint a Markdown file on disk using the provided {@link MarkyConfig}.
 *
 * @param filePath - Absolute or relative path to the Markdown file.
 * @param config - Optional configuration. Defaults to `{}`.
 * @returns A {@link LintResult} containing all reported violations.
 */
export async function lintFile(filePath: string, config: MarkyConfig = {}): Promise<LintResult> {
  const content = await readFile(filePath, 'utf8')
  return lintString(content, config, filePath)
}
