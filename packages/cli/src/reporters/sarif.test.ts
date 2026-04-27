import { describe, it, expect } from 'vitest'
import { formatSarif } from './sarif.js'
import type { LintResult } from '@crackdown/core'

const CLEAN: LintResult = { file: '/repo/README.md', violations: [] }

const WITH_VIOLATIONS: LintResult = {
  file: '/repo/docs/guide.md',
  violations: [
    {
      ruleId: 'crackdown:no-trailing-spaces',
      message: 'MD009: Trailing spaces found',
      line: 5,
      column: 12,
      severity: 'warn',
    },
    {
      ruleId: 'crackdown:fenced-code-language',
      message: 'MD040: Fenced code block should have a language specifier',
      line: 20,
      column: 1,
      severity: 'error',
    },
  ],
}

describe('formatSarif', () => {
  it('produces valid top-level SARIF 2.1.0 structure', () => {
    const output = formatSarif([CLEAN])
    const sarif = JSON.parse(output) as Record<string, unknown>
    expect(sarif['$schema']).toContain('sarif')
    expect(sarif['version']).toBe('2.1.0')
    expect(Array.isArray(sarif['runs'])).toBe(true)
  })

  it('names the tool "crackdown"', () => {
    const sarif = JSON.parse(formatSarif([CLEAN])) as {
      runs: { tool: { driver: { name: string } } }[]
    }
    expect(sarif.runs[0]?.tool.driver.name).toBe('crackdown')
  })

  it('returns zero results for a clean file', () => {
    const sarif = JSON.parse(formatSarif([CLEAN])) as {
      runs: { results: unknown[] }[]
    }
    expect(sarif.runs[0]?.results).toHaveLength(0)
  })

  it('maps each violation to a SARIF result', () => {
    const sarif = JSON.parse(formatSarif([WITH_VIOLATIONS])) as {
      runs: {
        results: {
          ruleId: string
          level: string
          message: { text: string }
          locations: { physicalLocation: { region: { startLine: number; startColumn: number } } }[]
        }[]
      }[]
    }
    const results = sarif.runs[0]?.results ?? []
    expect(results).toHaveLength(2)

    const first = results[0]!
    expect(first.ruleId).toBe('crackdown:no-trailing-spaces')
    expect(first.level).toBe('warning')
    expect(first.message.text).toContain('Trailing spaces')
    expect(first.locations[0]?.physicalLocation.region.startLine).toBe(5)
    expect(first.locations[0]?.physicalLocation.region.startColumn).toBe(12)

    const second = results[1]!
    expect(second.level).toBe('error')
  })

  it('uses relative URIs when repoRoot is provided', () => {
    const sarif = JSON.parse(formatSarif([WITH_VIOLATIONS], '/repo')) as {
      runs: {
        results: { locations: { physicalLocation: { artifactLocation: { uri: string } } }[] }[]
      }[]
    }
    const uri = sarif.runs[0]?.results[0]?.locations[0]?.physicalLocation.artifactLocation.uri
    expect(uri).toBe('docs/guide.md')
  })

  it('uses the full path when no repoRoot is given', () => {
    const sarif = JSON.parse(formatSarif([WITH_VIOLATIONS])) as {
      runs: {
        results: { locations: { physicalLocation: { artifactLocation: { uri: string } } }[] }[]
      }[]
    }
    const uri = sarif.runs[0]?.results[0]?.locations[0]?.physicalLocation.artifactLocation.uri
    expect(uri).toBe('/repo/docs/guide.md')
  })

  it('handles multiple files', () => {
    const sarif = JSON.parse(formatSarif([CLEAN, WITH_VIOLATIONS])) as {
      runs: { results: unknown[] }[]
    }
    expect(sarif.runs[0]?.results).toHaveLength(2)
  })
})
