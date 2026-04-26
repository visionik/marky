import { stat } from 'node:fs/promises'
import { dirname, join, parse as parsePath } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import type { Fixer, PluginEntry, Severity } from './types.js'

/** Severity values accepted in `MarkyConfig.rules`, plus the disabling 'off'. */
export type RuleSeverity = Severity | 'off'

/**
 * User-facing configuration for marky, typically declared in
 * `marky.config.ts` at the repository root.
 */
export interface MarkyConfig {
  /**
   * Map of rule identifiers (e.g. `"remark-lint:no-heading-punctuation"`)
   * to their severity level. Use `'off'` to disable a rule that a plugin
   * would otherwise enable by default.
   */
  rules?: Record<string, RuleSeverity>
  /**
   * Unified/remark plugins to apply as lint rules. Plugins are evaluated in
   * order after the built-in remark-parse / remark-gfm / remark-lint steps.
   */
  plugins?: PluginEntry[]
  /**
   * String-to-string fixer functions applied in order when running in fix mode.
   * Each fixer receives the full Markdown content and returns the corrected version.
   */
  fixers?: Fixer[]
}

/** Filename marky looks for when resolving a configuration. */
export const CONFIG_FILENAME = 'marky.config.ts'

const VALID_SEVERITIES: ReadonlySet<RuleSeverity> = new Set<RuleSeverity>(['error', 'warn', 'off'])

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isFile()
  } catch {
    return false
  }
}

/**
 * Walk up the directory tree from `cwd`, returning the first
 * `marky.config.ts` found, or `null` if no config file exists between
 * `cwd` and the filesystem root.
 */
export async function findConfigFile(cwd: string): Promise<string | null> {
  let current = cwd
  // parsePath().root === '/' on POSIX, e.g. 'C:\\' on Windows.
  const { root } = parsePath(current)
  // Hard cap to prevent any pathological infinite loop.
  for (let i = 0; i < 256; i += 1) {
    const candidate = join(current, CONFIG_FILENAME)
    if (await fileExists(candidate)) {
      return candidate
    }
    if (current === root) return null
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
  return null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateConfig(loaded: unknown, configPath: string): MarkyConfig {
  if (loaded === null || loaded === undefined) {
    return {}
  }
  if (!isPlainObject(loaded)) {
    throw new Error(`Invalid marky.config.ts at ${configPath}: default export must be an object.`)
  }

  const config: MarkyConfig = {}

  if ('rules' in loaded && loaded.rules !== undefined) {
    const rules = loaded.rules
    if (!isPlainObject(rules)) {
      throw new Error(`Invalid marky.config.ts at ${configPath}: "rules" must be an object.`)
    }
    const validated: Record<string, RuleSeverity> = {}
    for (const [ruleId, severity] of Object.entries(rules)) {
      if (typeof severity !== 'string' || !VALID_SEVERITIES.has(severity as RuleSeverity)) {
        throw new Error(
          `Invalid marky.config.ts at ${configPath}: rule "${ruleId}" has invalid severity ${JSON.stringify(
            severity,
          )}. Expected "error", "warn", or "off".`,
        )
      }
      validated[ruleId] = severity as RuleSeverity
    }
    config.rules = validated
  }

  if ('plugins' in loaded && loaded.plugins !== undefined) {
    const plugins = loaded.plugins
    if (!Array.isArray(plugins)) {
      throw new Error(`Invalid marky.config.ts at ${configPath}: "plugins" must be an array.`)
    }
    config.plugins = plugins as PluginEntry[]
  }

  if ('fixers' in loaded && loaded.fixers !== undefined) {
    const fixers = loaded.fixers
    if (!Array.isArray(fixers)) {
      throw new Error(`Invalid marky.config.ts at ${configPath}: "fixers" must be an array.`)
    }
    config.fixers = fixers as Fixer[]
  }

  return config
}

/**
 * Load a marky configuration from a specific file path.
 *
 * Uses {@link https://github.com/unjs/jiti | jiti} to evaluate TypeScript
 * config files at runtime so users do not need a separate compile step.
 *
 * @param configPath - Absolute path to a `marky.config.ts` file.
 * @returns The validated, normalized {@link MarkyConfig}.
 * @throws If the file's default export is not a valid `MarkyConfig` shape.
 */
export async function loadConfigFromFile(configPath: string): Promise<MarkyConfig> {
  const jiti = createJiti(pathToFileURL(configPath).href, {
    interopDefault: false,
    moduleCache: false,
  })
  // Load the whole module namespace and pick `.default` ourselves so we can
  // safely handle `export default null` (jiti's `{ default: true }` shortcut
  // throws "Reflect.get called on non-object" in that case).
  const mod = await jiti.import<Record<string, unknown>>(configPath)
  const loaded = mod && typeof mod === 'object' ? mod.default : mod
  return validateConfig(loaded, configPath)
}

/**
 * Resolve and load a marky configuration starting from `cwd`. Walks up the
 * directory tree until a `marky.config.ts` is found or the filesystem root
 * is reached. Returns an empty config when none is found.
 *
 * @param cwd - Directory to start the search from.
 * @returns The loaded {@link MarkyConfig}, or `{}` if no config exists.
 */
export async function loadConfig(cwd: string): Promise<MarkyConfig> {
  const configPath = await findConfigFile(cwd)
  if (!configPath) return {}
  return loadConfigFromFile(configPath)
}
