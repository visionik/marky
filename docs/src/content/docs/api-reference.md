---
title: API Reference
description: Complete reference for the @marky/core programmatic API.
---

All types and functions below are exported from `@marky/core`.

## Types

### `MarkyConfig`

Configuration object for marky. Typically declared in `marky.config.ts`.

```ts
interface MarkyConfig {
  /**
   * Per-rule severity overrides. Key: rule ID (e.g. 'marky:no-trailing-spaces').
   * Values: 'error' | 'warn' | 'off'
   */
  rules?: Record<string, RuleSeverity>

  /**
   * Unified/remark plugins to apply as lint rules.
   * Supports bare plugins or [plugin, options] tuples.
   */
  plugins?: PluginEntry[]

  /**
   * String-to-string fixer functions applied when running in fix mode.
   */
  fixers?: Fixer[]
}
```

### `LintResult`

```ts
interface LintResult {
  /** File path, or '<string>' for string input, '<stdin>' for stdin. */
  file: string
  /** All violations found. Empty array means clean. */
  violations: LintViolation[]
}
```

### `LintViolation`

```ts
interface LintViolation {
  /** Rule identifier, e.g. 'marky:no-trailing-spaces' */
  ruleId: string
  /** Human-readable description. */
  message: string
  /** 1-based line number. */
  line: number
  /** 1-based column number. */
  column: number
  /** Severity level. */
  severity: 'error' | 'warn'
}
```

### `FixResult`

Returned by `lintStringFix` / `lintFileFix`.

```ts
interface FixResult extends LintResult {
  /** The Markdown content after all fixers have been applied. */
  fixed: string
  /** Number of violations resolved by fixers (original count minus remaining). */
  fixedCount: number
}
```

### `Fixer`

```ts
type Fixer = (content: string) => string
```

A pure string-to-string transformer. Applied in order by `lintStringFix`.

### `PluginEntry`

```ts
type PluginEntry = Plugin | [Plugin, ...unknown[]]
```

Either a bare unified plugin or a `[plugin, options]` tuple.

---

## Functions

### `lintString(content, config?, filename?)`

Lint a Markdown string.

```ts
function lintString(
  content: string,
  config?: MarkyConfig,
  filename?: string,   // default: '<string>'
): Promise<LintResult>
```

### `lintFile(filePath, config?)`

Lint a Markdown file on disk.

```ts
function lintFile(
  filePath: string,
  config?: MarkyConfig,
): Promise<LintResult>
```

### `lint(files, config?)`

Lint multiple files. Returns one `LintResult` per file in input order.

```ts
function lint(
  files: string[],
  config?: MarkyConfig,
): Promise<LintResult[]>
```

### `lintStringFix(content, config?, filename?)`

Lint and fix a Markdown string. Returns the fixed content and a violation count.

```ts
function lintStringFix(
  content: string,
  config?: MarkyConfig,
  filename?: string,
): Promise<FixResult>
```

### `lintFileFix(filePath, config?)`

Lint and fix a Markdown file. **Read-only** — does not write to disk.
Callers (e.g. the `--fix` CLI) write `result.fixed` back to the file.

```ts
function lintFileFix(
  filePath: string,
  config?: MarkyConfig,
): Promise<FixResult>
```

### `loadConfig(cwd)`

Walk up the directory tree from `cwd` and load the nearest `marky.config.ts`.
Returns `{}` if no config is found.

```ts
function loadConfig(cwd: string): Promise<MarkyConfig>
```

### `loadConfigFromFile(configPath)`

Load a specific `marky.config.ts` file via jiti (TypeScript evaluated at runtime).

```ts
function loadConfigFromFile(configPath: string): Promise<MarkyConfig>
```

---

## Bundled rules

Exported from `@marky/core`:

| Export | Description |
|---|---|
| `md009Rule` | Trailing spaces — lint rule |
| `md009Fixer` | Trailing spaces — string fixer |
| `md010Rule` | Hard tabs — lint rule |
| `md010Fixer(content, opts?)` | Hard tabs — string fixer (configurable `tabSize`, default 4) |
