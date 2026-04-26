---
title: CLI Reference
description: Complete reference for all marky CLI commands, flags, and exit codes.
---

The `marky` CLI is the primary entry point for linting Markdown files from the command line or CI pipelines.

## `marky lint`

Lint one or more Markdown files.

```sh
marky lint <paths...> [options]
```

### Arguments

| Argument | Description |
|---|---|
| `<paths...>` | One or more file paths, directories, or `-` for stdin. Directories are walked recursively for `*.md` files. |

### Options

| Flag | Default | Description |
|---|---|---|
| `-f, --format <format>` | `pretty` | Output format. Choices: `pretty`, `json`. |
| `-c, --config <path>` | _(auto-discover)_ | Explicit path to a `marky.config.ts` file. Overrides directory-walk config discovery. |
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
marky lint README.md

# Lint an entire directory
marky lint docs/

# Read from stdin
cat README.md | marky lint -

# Output machine-readable JSON for CI
marky lint docs/ --format json

# Use an explicit config
marky lint src/ --config ./configs/strict.marky.config.ts

# Auto-fix and preview changes without writing
marky lint docs/ --fix --dry-run

# Auto-fix and write in place
marky lint docs/ --fix
```

---

## `marky migrate`

Migrate a markdownlint config file to a `marky.config.ts`.

```sh
marky migrate [config-path]
```

### Arguments

| Argument | Description |
|---|---|
| `[config-path]` | Path to a `.markdownlintrc` or `.markdownlint.json` file. If omitted, marky looks for `.markdownlintrc` then `.markdownlint.json` in the current directory. |

### Output

- Prints a report listing each rule as `✓ supported` or `✗ unsupported`.
- Writes a `marky.config.ts` file alongside the discovered config file with all supported rules pre-wired.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Migration completed (even if some rules are unsupported). |
| `1` | Config file not found or could not be parsed. |

### Example

```sh
marky migrate .markdownlintrc
```

Output:

```
Analyzing /project/.markdownlintrc...

Supported rules (will be migrated):
  ✓ MD013  →  md013Rule from @marky/compat-markdownlint  (Line length)
  ✓ MD041  →  md041Rule from @marky/compat-markdownlint  (First line heading)

Unsupported rules (require manual attention):
  ✗ MD005  →  no marky equivalent yet

Migration complete: 2 rules migrated, 1 rule requires manual attention.
Generated: /project/marky.config.ts
```

---

## `marky lsp`

Start the marky Language Server over stdio.

```sh
marky lsp
```

This command is intended for use by editor integrations. It starts the `@marky/lsp` server and communicates via the LSP protocol over stdin/stdout.

**Editor configuration examples:**

Neovim (via `nvim-lspconfig`):

```lua
require('lspconfig').marky.setup({
  cmd = { 'marky', 'lsp' },
  filetypes = { 'markdown' },
})
```

Zed (`settings.json`):

```json
{
  "lsp": {
    "marky": {
      "initialization_options": {}
    }
  }
}
```
