---
title: CLI Reference
description: Complete reference for all marky CLI commands, flags, and exit codes.
---

The `crackdown` CLI is the primary entry point for linting Markdown files from the command line or CI pipelines.

## `crackdown lint`

Lint one or more Markdown files.

```sh
crackdown lint <paths...> [options]
```

### Arguments

| Argument | Description |
|---|---|
| `<paths...>` | One or more file paths, directories, or `-` for stdin. Directories are walked recursively for `*.md` files. |

### Options

| Flag | Default | Description |
|---|---|---|
| `-f, --format <format>` | `pretty` | Output format. Choices: `pretty`, `json`. |
| `-c, --config <path>` | _(auto-discover)_ | Explicit path to a `crackdown.config.ts` file. Overrides directory-walk config discovery. |
| `--fix` | — | Apply all fixers from `config.fixers` and rewrite files in place. |
| `--dry-run` | — | With `--fix`: show what would change without writing to disk. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No violations at `error` severity. Warnings do not affect exit code. |
| `1` | One or more `error`-severity violations remain (including after `--fix`). Also returned on argument errors. |

### Examples

```sh
# Lint a single file
crackdown lint README.md

# Lint an entire directory
crackdown lint docs/

# Read from stdin
cat README.md | crackdown lint -

# Output machine-readable JSON for CI
crackdown lint docs/ --format json

# Use an explicit config
crackdown lint src/ --config ./configs/strict.crackdown.config.ts

# Auto-fix and preview changes without writing
crackdown lint docs/ --fix --dry-run

# Auto-fix and write in place
crackdown lint docs/ --fix
```

---

## `crackdown migrate`

Migrate a markdownlint config file to a `crackdown.config.ts`.

```sh
crackdown migrate [config-path]
```

### Arguments

| Argument | Description |
|---|---|
| `[config-path]` | Path to a `.markdownlintrc` or `.markdownlint.json` file. If omitted, marky looks for `.markdownlintrc` then `.markdownlint.json` in the current directory. |

### Output

- Prints a report listing each rule as `✓ supported` or `✗ unsupported`.
- Writes a `crackdown.config.ts` file alongside the discovered config file with all supported rules pre-wired.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Migration completed (even if some rules are unsupported). |
| `1` | Config file not found or could not be parsed. |

### Example

```sh
crackdown migrate .markdownlintrc
```

Output:

```text
Analyzing /project/.markdownlintrc...

Supported rules (will be migrated):
  ✓ MD009  →  md009Rule from @crackdown/core  (No trailing spaces)
  ✓ MD010  →  md010Rule from @crackdown/core  (No hard tabs)
  ✓ MD013  →  md013Rule from @crackdown/compat-markdownlint  (Line length)
  ✓ MD041  →  md041Rule from @crackdown/compat-markdownlint  (First line heading)
  ✓ MD047  →  md047Rule from @crackdown/compat-markdownlint  (Files should end with a single newline)

Unsupported rules (require manual attention):
  ✗ MD003  →  no marky equivalent yet

Migration complete: 5 rules migrated, 1 rule requires manual attention.
Generated: /project/crackdown.config.ts
```

18 markdownlint rules are supported in total. Run `crackdown migrate` with any `.markdownlintrc` to see the full report for your config.

---

## `crackdown lsp`

Start the marky Language Server over stdio.

```sh
crackdown lsp
```

This command is intended for use by editor integrations. It starts the `@crackdown/lsp` server and communicates via the LSP protocol over stdin/stdout.

**Editor configuration examples:**

Neovim (via `nvim-lspconfig`):

```lua
require('lspconfig').marky.setup({
  cmd = { 'crackdown', 'lsp' },
  filetypes = { 'markdown' },
})
```

Zed (`settings.json`):

```json
{
  "lsp": {
    "crackdown": {
      "initialization_options": {}
    }
  }
}
```
