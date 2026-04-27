import { describe, it, expect } from 'vitest'
import { COMPAT_VERSION } from './index.js'

describe('@crackdown/compat-markdownlint', () => {
  it('exports COMPAT_VERSION', () => {
    expect(COMPAT_VERSION).toBe('0.0.1')
  })
})
