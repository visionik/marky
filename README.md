# crackdown

**An extensible, plugin-based Markdown linter with first-class Mermaid diagram validation.**

crackdown analyzes Markdown via [mdast](https://github.com/syntax-tree/mdast) (the unified/remark ecosystem), supports a TypeScript config, ships auto-fix, markdownlint compatibility, SARIF output, and an LSP server for editors.

| | |
|---|---|
| **Docs** | [visionik.github.io/crackdown](https://visionik.github.io/crackdown/) |
| **Repo** | [github.com/visionik/crackdown](https://github.com/visionik/crackdown) |
| **npm** | [`@crackdown/core`](https://www.npmjs.com/package/@crackdown/core) · [`@crackdown/cli`](https://www.npmjs.com/package/@crackdown/cli) |
| **Version** | `0.1.1` |

---

## Why crackdown?

- **Mermaid-first** — validates fenced `mermaid` code blocks with `@mermaid-js/parser` so diagram syntax errors show up before your docs site fails.
- **Built on unified/remark** — full mdast pipeline; rules are position-aware and composable with the remark plugin ecosystem.
- **markdownlint compatible** — bridge for `.markdownlintrc` / `.markdownlint.json`, plus `crackdown migrate` to generate `crackdown.config.ts`.
- **Auto-fix** — `crackdown lint --fix` (and `--dry-run`) for safe mechanical fixes (trailing spaces, hard tabs, blank lines, trailing newline).
- **Editor-ready** — LSP over stdio (`crackdown lsp`) and a VS Code extension package.
- **CI-friendly** — pretty, JSON, and SARIF reporters; exit code reflects error-severity violations.

---

## Quick start

```sh
pnpm add -D @crackdown/core @crackdown/cli

# Lint a file
pnpm exec crackdown lint README.md

# Auto-fix (preview)
pnpm exec crackdown lint docs/ --fix --dry-run

# Auto-fix in place
pnpm exec crackdown lint docs/ --fix

# Machine-readable output for CI
pnpm exec crackdown lint docs/ --format json
# or SARIF for GitHub Code Scanning
pnpm exec crackdown lint docs/ --format sarif --output results.sarif
```

### Minimal config

Create `crackdown.config.ts` at the repo root (or any parent of the files you lint):

```ts
import { md009Rule, md009Fixer, md010Rule, md010Fixer } from '@crackdown/core'
import {
  md040Rule,
  md041Rule,
  md047Rule,
  md047Fixer,
} from '@crackdown/compat-markdownlint'
import { remarkLintMermaid } from '@crackdown/plugin-mermaid'
import type { MarkyConfig } from '@crackdown/core'

const config: MarkyConfig = {
  plugins: [
    md009Rule, // no trailing spaces
    md010Rule, // no hard tabs
    md040Rule, // fenced code blocks have a language
    md041Rule, // first line is a heading
    md047Rule, // file ends with a newline
    remarkLintMermaid, // validate mermaid fences
  ],
  fixers: [md009Fixer, md010Fixer, md047Fixer],
}

export default config
```

Config is discovered by walking up from the working directory. Override with `--config <path>`.

### Migrate from markdownlint

```sh
pnpm add -D @crackdown/compat-markdownlint
pnpm exec crackdown migrate .markdownlintrc
```

This writes a `crackdown.config.ts` and prints which rules were mapped vs need manual attention. See the [migration guide](https://visionik.github.io/crackdown/migration/).

---

## Packages

| Package | Description |
|---------|-------------|
| [`@crackdown/core`](./packages/core) | Lint pipeline, config loader, programmatic API, core rules/fixers |
| [`@crackdown/cli`](./packages/cli) | CLI: `lint`, `migrate`, `lsp` |
| [`@crackdown/compat-markdownlint`](./packages/compat-markdownlint) | markdownlint config bridge + ~18 rule ports |
| [`@crackdown/plugin-mermaid`](./packages/plugin-mermaid) | Mermaid fence validation |
| [`@crackdown/lsp`](./packages/lsp) | Language Server Protocol server |
| [`@crackdown/vscode`](./packages/vscode) | VS Code extension (Language Client) |

### Programmatic API

```ts
import { lint, lintString, loadConfig } from '@crackdown/core'

const config = await loadConfig(process.cwd())
const results = await lint(['README.md', 'docs/intro.md'], config)

const single = await lintString('# Hello\n', config, 'README.md')
console.log(single.violations)
```

Also available: `lintFile`, `lintStringFix`, `lintFileFix`, `loadConfigFromFile`.

---

## CLI

```text
crackdown lint [options] <paths...>
crackdown migrate [config-path]
crackdown lsp
```

| Flag | Description |
|------|-------------|
| `-f, --format <pretty\|json\|sarif>` | Output format (default: `pretty`) |
| `-c, --config <path>` | Explicit config path |
| `--fix` | Apply fixers and rewrite files |
| `--dry-run` | With `--fix`, preview only |
| `--output <path>` | Write report to a file |
| `--concurrency <n>` | Parallel file linting |
| `--repo-root <path>` | Base path for SARIF URIs |

**Exit codes:** `0` if no error-severity violations remain; `1` otherwise (or on usage/config errors). Warnings alone do not fail the process.

Full reference: [CLI docs](https://visionik.github.io/crackdown/cli-reference/).

---

## Supported markdownlint-style rules

| Rule | Description | Fixer |
|------|-------------|-------|
| MD001 | Heading levels increment by one | |
| MD005 | List item indentation | |
| MD007 | Unordered list indent (configurable) | |
| MD009 | Trailing spaces | yes |
| MD010 | Hard tabs | yes |
| MD012 | Multiple consecutive blank lines | yes |
| MD013 | Line length (configurable) | |
| MD022 | Blank lines around headings | |
| MD024 | No duplicate headings | |
| MD025 | Single top-level heading | |
| MD026 | Trailing punctuation in headings | |
| MD031 | Blank lines around fences | |
| MD032 | Blank lines around lists | |
| MD033 | No inline HTML | |
| MD034 | No bare URLs | |
| MD040 | Fenced code language required | |
| MD041 | First line is a heading | |
| MD047 | File ends with a single newline | yes |

Plus **Mermaid syntax** via `@crackdown/plugin-mermaid` (`crackdown:mermaid-syntax`).

Not yet ported (examples): MD003, MD036. Contribute rules using the [plugin guide](https://visionik.github.io/crackdown/plugin-guide/).

---

## Editors

```sh
crackdown lsp   # stdio Language Server
```

- **VS Code** — `@crackdown/vscode` (Language Client → `@crackdown/lsp`)
- **Neovim / Zed / Helix** — point your LSP client at `crackdown lsp`

The server publishes diagnostics on open/save/change (debounced), reloads `crackdown.config.ts` on change, and can surface fix-related code actions when fixers are registered.

---

## Repository layout

```text
crackdown/
├── packages/
│   ├── core/                  # @crackdown/core
│   ├── cli/                   # @crackdown/cli
│   ├── compat-markdownlint/   # markdownlint bridge + rules
│   ├── plugin-mermaid/        # Mermaid plugin
│   ├── lsp/                   # Language Server
│   └── vscode/                # VS Code extension
├── docs/                      # Astro Starlight site
├── go/                        # Experimental Go port (see PR / go/)
├── crackdown.config.ts        # Dogfood config for this repo
├── Taskfile.yml               # Primary task entrypoint
└── Taskfile.go.yml            # Go build/test tasks (optional)
```

This is a **pnpm** workspace monorepo (`pnpm@10`).

---

## Development

Prerequisites: Node.js 20+, [pnpm](https://pnpm.io), [Task](https://taskfile.dev).

```sh
pnpm install
task build
task check          # fmt:check, lint, typecheck, test:coverage (≥85%)
```

Common tasks:

| Task | Purpose |
|------|---------|
| `task build` | Build all packages |
| `task test` / `task test:coverage` | Vitest (+ coverage gate) |
| `task lint` / `task fmt` | ESLint / Prettier |
| `task typecheck` | `tsc --noEmit` across packages |
| `task lint:docs` | Dogfood crackdown on repo Markdown |
| `task docs:dev` | Docs site dev server |
| `task release -- patch` | Version bump, changelog, tag, push (after check) |

Go port (optional):

```sh
task go:check       # vet, fmt, build, coverage
task go:build       # → bin/crackdown-go
```

Conventional Commits are required (`feat:`, `fix:`, `docs:`, …). See [CHANGELOG.md](./CHANGELOG.md).

---

## How it works (pipeline)

```text
Markdown source
  → parse (remark-parse / micromark / GFM) → mdast
  → transform (remark-lint + plugins) → VFile messages
  → collect → LintResult / LintViolation
  → optional fixers → re-lint → FixResult
  → report (pretty | json | sarif | LSP diagnostics)
```

Details: [Architecture](https://visionik.github.io/crackdown/architecture/).

---

## Compared to alternatives (short)

| Need | Prefer |
|------|--------|
| Maximum markdownlint rule coverage, JSON-only config | [markdownlint](https://github.com/DavidAnson/markdownlint) / markdownlint-cli2 |
| Mermaid validation, TS config, SARIF, LSP, unified plugins | **crackdown** |
| Prose / style-guide linting | Vale, textlint (complementary) |

crackdown is not a full 1:1 replacement for every markdownlint rule; it is strongest when you want **structural Markdown linting + Mermaid + modern DX**.

---

## License

See repository license file when present. Packages are published to npm under the `@crackdown` scope (`publishConfig.access: public`).

---

## Links

- [Getting started](https://visionik.github.io/crackdown/getting-started/)
- [CLI reference](https://visionik.github.io/crackdown/cli-reference/)
- [Plugin authoring](https://visionik.github.io/crackdown/plugin-guide/)
- [markdownlint migration](https://visionik.github.io/crackdown/migration/)
- [API reference](https://visionik.github.io/crackdown/api-reference/)
- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)
