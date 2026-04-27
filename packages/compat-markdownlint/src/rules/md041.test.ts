import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md041Rule } from './md041.js'

describe('md041Rule — first line heading', () => {
  it('produces no violations when the document starts with a heading', async () => {
    const result = await lintString('# Hello\n\nSome text.\n', {
      plugins: [md041Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation when the first block is a paragraph', async () => {
    const result = await lintString('Just some text.\n\n# Heading later\n', {
      plugins: [md041Rule],
    })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md041|first-heading/)
  })

  it('reports a violation when the document is only a paragraph', async () => {
    const result = await lintString('No heading here at all.\n', {
      plugins: [md041Rule],
    })
    expect(result.violations).toHaveLength(1)
  })

  it('produces no violations for an empty document', async () => {
    const result = await lintString('', { plugins: [md041Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('accepts H2 and H3 as valid first headings', async () => {
    const h2 = await lintString('## Section\n\nText.\n', {
      plugins: [md041Rule],
    })
    expect(h2.violations).toHaveLength(0)

    const h3 = await lintString('### Sub\n\nText.\n', {
      plugins: [md041Rule],
    })
    expect(h3.violations).toHaveLength(0)
  })
})
