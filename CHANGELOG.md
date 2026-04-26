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

#### Documentation site (`docs/`)
- Astro Starlight site at `docs/` — 8 pages built, Pagefind search, sitemap
- Landing page with feature cards (splash template)
- Getting Started: install, 60-second usage, `marky.config.ts` example, package table
- CLI Reference: all commands (`lint`, `migrate`, `lsp`), flags, exit codes, examples
- Plugin Authoring Guide: rule anatomy, options tuples, fixers, node types, testing
- API Reference: all `@marky/core` types (`MarkyConfig`, `LintResult`, `LintViolation`, `FixResult`, `Fixer`, `PluginEntry`) and functions
- markdownlint Migration Guide: automatic migration, rule mapping table, manual setup, severity config
- Architecture page: 5-step ASCII pipeline diagram, package layout, LSP architecture
- `task docs:dev`, `task docs:build`, `task docs:preview` targets added to root `Taskfile.yml`
- GitHub Pages CI workflow (`.github/workflows/docs.yml`): deploys on push to `main`
- Deployment URL: `https://visionik.github.io/marky/`

#### LSP server + VS Code extension
- `@marky/lsp` package — LSP server using `vscode-languageserver`
- `violationToDiagnostic` / `lintResultToDiagnostics` — pure mapping: 1-to-0-indexed positions, severity, source
- `validateMarkdown(content, uri, config)` — runs `lintString` and returns LSP `Diagnostic[]`
- `createServer(connection)` — wires `TextDocuments`: `onDidOpen`/`onDidSave` (immediate), `onDidChangeContent` (debounced 300ms), `onDidClose` (clear diagnostics)
- Config hot-reload: watches `marky.config.ts` via `fs.watch`, invalidates cache on change
- `codeActionProvider` stub: surfaces violations as QuickFix actions
- `@marky/vscode` package — VS Code extension stub using `vscode-languageclient`, spawns `@marky/lsp` over stdio
- `marky lsp` CLI command — starts the LSP server over stdio for Neovim, Zed, Helix, etc.

#### Rule porting tool (`@marky/cli` + `@marky/compat-markdownlint`)
- `marky migrate [config-path]` — reads `.markdownlintrc` / `.markdownlint.json`, classifies each rule as supported/unsupported/disabled, writes a ready-to-use `marky.config.ts` with imports pre-wired
- Migration report lists `✓` / `✗` per rule with the target symbol and source package
- Summary line: "N rules migrated, M rules require manual attention"
- Auto-discovers config in cwd when no path given; exits 1 if no config found
- New rules in `@marky/compat-markdownlint`:
  - `md001Rule` — heading levels increment by one
  - `md022Rule` — blank lines around headings
- `@marky/compat-markdownlint` `loadMarkdownlintConfig` now maps MD001, MD009, MD010, MD022, MD013, MD041
- README rule mapping table updated (6 supported, 4 not-yet-implemented)

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
