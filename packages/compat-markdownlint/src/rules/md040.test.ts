import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md040Rule } from './md040.js'

describe('md040Rule — fenced code blocks should have a language', () => {
  it('produces no violations for a code block with a language', async () => {
    const md = '```ts\nconst x = 1\n```\n'
    const result = await lintString(md, { plugins: [md040Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a code block without a language', async () => {
    const md = '```\nsome code\n```\n'
    const result = await lintString(md, { plugins: [md040Rule] })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md040|language/)
  })

  it('reports one violation per unlabelled code block', async () => {
    const md = '```\nblock one\n```\n\n```\nblock two\n```\n'
    const result = await lintString(md, { plugins: [md040Rule] })
    expect(result.violations).toHaveLength(2)
  })

  it('does not flag indented code blocks (non-fenced)', async () => {
    const md = '    indented code\n'
    const result = await lintString(md, { plugins: [md040Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles an empty document', async () => {
    const result = await lintString('', { plugins: [md040Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
