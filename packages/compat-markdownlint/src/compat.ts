import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PluginEntry } from '@marky/core'
import { md009Rule, md010Rule } from '@marky/core'
import { md001Rule } from './rules/md001.js'
import { md013Rule } from './rules/md013.js'
import { md022Rule } from './rules/md022.js'
import { md041Rule } from './rules/md041.js'

/** Shape returned by {@link loadMarkdownlintConfig}. */
export interface CompatConfig {
  plugins: PluginEntry[]
}

/** Map of supported markdownlint rule IDs to their marky plugin. */
const RULE_MAP: ReadonlyMap<string, PluginEntry> = new Map<string, PluginEntry>([
  ['MD001', md001Rule],
  ['MD009', md009Rule],
  ['MD010', md010Rule],
  ['MD013', md013Rule],
  ['MD022', md022Rule],
  ['MD041', md041Rule],
])

/**
 * Attempt to read `filename` from `cwd`. Returns `null` if the file does
 * not exist; throws on other read errors.
 */
async function tryReadJson(cwd: string, filename: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(cwd, filename), 'utf8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

/**
 * Load a markdownlint-style config file (`.markdownlintrc` or
 * `.markdownlint.json`) from `cwd` and translate any recognised, enabled
 * rules into the corresponding marky plugins.
 *
 * Returns `{ plugins: [] }` when no config file is found.
 */
export async function loadMarkdownlintConfig(cwd: string): Promise<CompatConfig> {
  const raw =
    (await tryReadJson(cwd, '.markdownlintrc')) ?? (await tryReadJson(cwd, '.markdownlint.json'))

  if (!raw) return { plugins: [] }

  const plugins: PluginEntry[] = []
  for (const [ruleId, enabled] of Object.entries(raw)) {
    if (!enabled) continue
    const plugin = RULE_MAP.get(ruleId.toUpperCase())
    if (plugin) plugins.push(plugin)
  }

  return { plugins }
}
