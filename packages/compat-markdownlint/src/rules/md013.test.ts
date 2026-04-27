import { describe, it, expect } from 'vitest'
import { lintString } from '@crackdown/core'
import { md013Rule } from './md013.js'

const LONG_LINE = 'a'.repeat(81)
const EXACT_LINE = 'a'.repeat(80)

describe('md013Rule — line length', () => {
  it('produces no violations for lines within the default 80-char limit', async () => {
    const result = await lintString(`# Heading\n\n${EXACT_LINE}\n`, {
      plugins: [md013Rule],
    })
    expect(result.violations).toHaveLength(0)
  })

  it('reports a violation for a line exceeding 80 chars', async () => {
    const result = await lintString(`# Heading\n\n${LONG_LINE}\n`, {
      plugins: [md013Rule],
    })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]?.ruleId).toMatch(/md013|maximum-line-length/)
  })

  it('reports multiple violations when multiple lines are too long', async () => {
    const content = `${LONG_LINE}\n\n${LONG_LINE}\n`
    const result = await lintString(content, { plugins: [md013Rule] })
    expect(result.violations.length).toBeGreaterThanOrEqual(2)
  })

  it('produces no violations for an empty document', async () => {
    const result = await lintString('', { plugins: [md013Rule] })
    expect(result.violations).toHaveLength(0)
  })

  it('accepts a custom lineLength option', async () => {
    const line60 = 'a'.repeat(61)
    const result = await lintString(`${line60}\n`, {
      plugins: [[md013Rule, { lineLength: 60 }]],
    })
    expect(result.violations).toHaveLength(1)
  })
})
