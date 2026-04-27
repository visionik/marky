import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md007Rule } from './md007.js'

describe('md007Rule — unordered list indentation', () => {
  it('produces no violations for a flat list', async () => {
    const md = '- item one\n- item two\n'
    const result = await lintString(md, { plugins: [md007Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for nested lists with 2-space indent (default)', async () => {
    // 2 spaces before the nested -
    const md = '- item\n  - nested\n'
    const result = await lintString(md, { plugins: [md007Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for 4-space indent when default is 2', async () => {
    // 4 spaces before the nested -
    const md = '- item\n    - nested\n'
    const result = await lintString(md, { plugins: [md007Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(1)
    expect(result.violations[0]?.ruleId).toMatch(/md007|indent/)
  })

  it('allows configuring a different indent via [rule, { indent }]', async () => {
    // 4-space indent is OK when configured as such
    const md = '- item\n    - nested\n'
    const result = await lintString(md, {
      plugins: [[md007Rule, { indent: 4 }]],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for a deeply nested correctly-indented list', async () => {
    const md = '- a\n  - b\n    - c\n'
    const result = await lintString(md, { plugins: [md007Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles an empty document', async () => {
    const result = await lintString('', { plugins: [md007Rule] })
    expect(result.violations).toHaveLength(0)
  })
})
