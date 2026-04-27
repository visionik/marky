import { describe, it, expect } from 'vitest'
import { lintString } from '@marky/core'
import { md032Rule } from './md032.js'

describe('md032Rule — blank lines around lists', () => {
  it('produces no violations for a list with surrounding blank lines', async () => {
    const md = 'Text.\n\n- item one\n- item two\n\nMore text.\n'
    const result = await lintString(md, { plugins: [md032Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when no blank line precedes the list', async () => {
    // Heading + paragraph immediately followed by list — no blank before list
    const result = await lintString('# H\n\nText.\n- item\n\nAfter.\n', { plugins: [md032Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md032|list/)
  })

  it('reports a violation when no blank line follows the list', async () => {
    // Use a heading after the list: headings cannot lazily continue a list item
    const md = '- item\n## Heading after list\n'
    const result = await lintString(md, { plugins: [md032Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })

  it('produces no violations for a list at the start of the document', async () => {
    const md = '- item\n- item two\n\nText.\n'
    const result = await lintString(md, { plugins: [md032Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles ordered lists', async () => {
    const md = 'Text.\n1. first\n2. second\n\nMore.\n'
    const result = await lintString(md, { plugins: [md032Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
  })
})
