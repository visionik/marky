import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md005Rule } from './md005.js'

describe('md005Rule — consistent list indentation per level', () => {
  it('produces no violations for a flat list with consistent indentation', async () => {
    const md = '- item one\n- item two\n- item three\n'
    const result = await lintString(md, { plugins: [md005Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for nested lists with consistent indentation', async () => {
    const md = '- item\n  - nested a\n  - nested b\n'
    const result = await lintString(md, { plugins: [md005Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for an ordered list', async () => {
    const md = '1. first\n2. second\n3. third\n'
    const result = await lintString(md, { plugins: [md005Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('handles an empty document', async () => {
    const result = await lintString('', { plugins: [md005Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('produces no violations for a document with no lists', async () => {
    const result = await lintString('# Heading\n\nParagraph.\n', {
      plugins: [md005Rule],
    })
    expect(result.violations).toHaveLength(0)
  })
})
