# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Auto-fix support (`@marky/core` + `@marky/cli`)
- `Fixer` type: `(content: string) => string` — pure string transformer for safe mechanical fixes
- `FixResult` interface: extends `LintResult` with `fixed: string` and `fixedCount: number`
- `lintStringFix(content, config?, filename?)` and `lintFileFix(path, config?)` — run fixers then re-lint to surface remaining violations
- `MarkyConfig.fixers?: Fixer[]` — register fixers alongside plugins in `marky.config.ts`
- `marky lint --fix` — applies fixers and rewrites files in place; reports per-file fix counts
- `marky lint --fix --dry-run` — shows what would change without writing to disk
- Exit code reflects remaining error-severity violations after fixing

#### Bundled rules (`@marky/core`)
- `md009Rule` + `md009Fixer` — trailing spaces: detect and strip via regex-based line scanner
- `md010Rule` + `md010Fixer(content, { tabSize? })` — hard tabs: detect and replace with configurable spaces (default: 4)

## [0.1.0] — 2026-04-26 — Phase 1 MVP

### Added

#### `@marky/core`
- `lintString(content, config?)` and `lintFile(path, config?)` — unified/remark/mdast lint pipeline
- `MarkyConfig` — `{ rules, plugins: PluginEntry[] }` with per-rule severity overrides and `'off'` disabling
- `loadConfig(cwd)` — walks directory tree, loads `marky.config.ts` at runtime via jiti
- `lint(files[], config?)` — programmatic Node.js API returning `LintResult[]`
- `PluginEntry` type — supports bare plugins and `[plugin, options]` unified tuples
- Full TypeScript types exported: `LintResult`, `LintViolation`, `Severity`, `Plugin`, `PluginEntry`, `MarkyConfig`, `RuleSeverity`

#### `@marky/cli`
- `marky lint <glob|dir|->` CLI with `--format pretty|json` and `--config <path>` flags
- Pretty terminal reporter: violations grouped by file with `line:col`, severity icon, rule ID
- JSON reporter: structured `LintResult[]` output for CI pipelines
- Exit 0 on clean; exit 1 on any error-severity violation

#### `@marky/plugin-mermaid`
- `remarkLintMermaid` — validates `lang=mermaid` fenced code blocks via `@mermaid-js/parser`
- Keyword detection maps diagram types to parser; unsupported types and empty blocks skipped gracefully
- Violations point to the code fence opening line/column

#### `@marky/compat-markdownlint`
- `loadMarkdownlintConfig(cwd)` — reads `.markdownlintrc` / `.markdownlint.json`, maps enabled rules to plugins
- MD013 (line-length, configurable via `[rule, { lineLength }]` options tuple)
- MD041 (first-line-heading)
- README with supported/unsupported rule mapping table

#### Infrastructure
- pnpm workspace monorepo with shared TypeScript 5 strict config
- vitest 3 with v8 coverage (≥85% threshold enforced)
- ESLint 9 flat config + Prettier 3
- `Taskfile.yml` with `build`, `test`, `test:coverage`, `lint`, `fmt`, `typecheck`, `check`, `clean`
- `marky.config.ts` example at repo root
- `.github/PULL_REQUEST_TEMPLATE.md`

### Metrics
- 72 tests across 12 test files
- 97.67% statement coverage · 88.5% branch coverage · 95.83% function coverage
