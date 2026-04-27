import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md031Rule } from './md031.js'

describe('md031Rule — blank lines around fenced code blocks', () => {
  it('produces no violations for a code block with surrounding blank lines', async () => {
    const md = 'Text.\n\n```ts\nconst x = 1\n```\n\nMore text.\n'
    const result = await lintString(md, { plugins: [md031Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when no blank line precedes the code block', async () => {
    const md = 'Text.\n```ts\nconst x = 1\n```\n\nMore text.\n'
    const result = await lintString(md, { plugins: [md031Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md031|blanks-around-fences/)
  })

  it('reports a violation when no blank line follows the code block', async () => {
    const md = 'Text.\n\n```ts\nconst x = 1\n```\nMore text.\n'
    const result = await lintString(md, { plugins: [md031Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('produces no violations for a code block at the start of the document', async () => {
    const md = '```sh\necho hi\n```\n\nText.\n'
    const result = await lintString(md, { plugins: [md031Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for a code block at the end of the document', async () => {
    const md = 'Text.\n\n```sh\necho hi\n```\n'
    const result = await lintString(md, { plugins: [md031Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
