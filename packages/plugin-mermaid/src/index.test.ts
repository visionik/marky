import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import remarkLintMermaid, { PLUGIN_NAME, remarkLintMermaid as namedExport } from './index.js'

describe('@marky/plugin-mermaid exports', () => {
  it('exposes PLUGIN_NAME', () => {
    expect(PLUGIN_NAME).toBe('marky-lint-mermaid')
  })

  it('exposes remarkLintMermaid as both default and named export', () => {
    expect(namedExport).toBe(remarkLintMermaid)
    expect(typeof remarkLintMermaid).toBe('function')
  })
})

describe('remarkLintMermaid — code block visiting', () => {
  it('produces zero violations for a valid flowchart block', async () => {
    const md = ['```mermaid', 'flowchart TD', '  A --> B', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('produces zero violations for a valid pie chart block', async () => {
    const md = ['```mermaid', 'pie title Pets', '  "Dogs" : 386', '  "Cats" : 85', '```', ''].join(
      '\n',
    )
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('ignores non-mermaid code blocks (different lang)', async () => {
    const md = ['```js', 'const x = "not mermaid"', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('ignores fenced code blocks with no language', async () => {
    const md = ['```', 'plain text', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('handles empty mermaid block gracefully (zero violations)', async () => {
    const md = ['```mermaid', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('handles whitespace-only mermaid block gracefully', async () => {
    const md = ['```mermaid', '   ', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })

  it('skips diagram types unsupported by @mermaid-js/parser without error', async () => {
    // sequenceDiagram is a real Mermaid type but unsupported by the v1 parser;
    // the plugin must not falsely report violations for these.
    const md = ['```mermaid', 'sequenceDiagram', '  Alice->>Bob: Hi', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(0)
  })
})

describe('remarkLintMermaid — invalid syntax', () => {
  it('reports a violation for invalid pie syntax', async () => {
    const md = [
      '# Heading',
      '',
      '```mermaid',
      'pie',
      '  this is not valid pie syntax @@@@',
      '```',
      '',
    ].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    const v = result.violations[0]
    expect(v).toBeDefined()
    expect(v!.ruleId).toBe('marky:mermaid-syntax')
    // Position should point at the code block opening fence (line 3 in this fixture).
    expect(v!.line).toBe(3)
    expect(v!.column).toBe(1)
    expect(v!.message.length).toBeGreaterThan(0)
  })

  it('reports a violation for invalid info syntax', async () => {
    const md = ['```mermaid', 'info', '  ??? this is junk ???', '```', ''].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toBe('marky:mermaid-syntax')
  })

  it('only reports against the failing block when multiple are present', async () => {
    const md = [
      '```mermaid',
      'flowchart TD',
      '  A --> B',
      '```',
      '',
      '```mermaid',
      'pie',
      '  garbage @@@@',
      '```',
      '',
    ].join('\n')
    const result = await lintString(md, [remarkLintMermaid])
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toBe('marky:mermaid-syntax')
    // Second code block opens on line 6.
    expect(result.violations[0]?.line).toBe(6)
  })
})
