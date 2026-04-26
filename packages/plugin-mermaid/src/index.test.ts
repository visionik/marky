import { describe, it, expect } from 'vitest'
import { PLUGIN_NAME } from './index.js'

describe('@marky/plugin-mermaid', () => {
  it('exports PLUGIN_NAME', () => {
    expect(PLUGIN_NAME).toBe('marky-lint-mermaid')
  })
})
