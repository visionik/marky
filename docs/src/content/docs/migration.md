---
title: Migrating from markdownlint
description: Step-by-step guide to migrating your .markdownlintrc config to marky.config.ts.
---

marky ships a built-in migration tool that reads your `.markdownlintrc` and generates a ready-to-use `marky.config.ts` with all supported rules pre-wired.

## Automatic migration

```sh
marky migrate .markdownlintrc
```

This command:
1. Reads your existing config file.
2. Maps each enabled rule to its marky equivalent.
3. Writes `marky.config.ts` alongside the config file.
4. Prints a report with `✓ supported` and `✗ unsupported` rules.

## Rule mapping reference

| markdownlint rule | marky equivalent | Package |
|---|---|---|
| MD001 (heading-increment) | `md001Rule` | `@marky/compat-markdownlint` |
| MD009 (trailing-spaces) | `md009Rule` / `md009Fixer` | `@marky/core` |
| MD010 (no-hard-tabs) | `md010Rule` / `md010Fixer` | `@marky/core` |
| MD013 (line-length) | `md013Rule` | `@marky/compat-markdownlint` |
| MD022 (blanks-around-headings) | `md022Rule` | `@marky/compat-markdownlint` |
| MD041 (first-line-heading) | `md041Rule` | `@marky/compat-markdownlint` |
| MD005, MD007, MD031, MD032 | Not yet implemented | — |

## Manual migration

If you prefer to set up manually:

```sh
pnpm add -D @marky/core @marky/cli @marky/compat-markdownlint
```

Create `marky.config.ts`:

```ts
import {
  md001Rule,
  md013Rule,
  md022Rule,
  md041Rule,
} from '@marky/compat-markdownlint'
import { md009Rule, md009Fixer, md010Rule, md010Fixer } from '@marky/core'
import type { MarkyConfig } from '@marky/core'

const config: MarkyConfig = {
  plugins: [
    md001Rule,   // heading levels increment by 1
    md009Rule,   // no trailing spaces (lint)
    md010Rule,   // no hard tabs (lint)
    md013Rule,   // line length ≤ 80
    md022Rule,   // blank lines around headings
    md041Rule,   // first line must be a heading
  ],
  fixers: [
    md009Fixer,           // auto-strip trailing spaces
    md010Fixer,           // auto-replace tabs with 4 spaces
    // (c) => md010Fixer(c, { tabSize: 2 }),  // custom tab size
  ],
}

export default config
```

## Configuring line length (MD013)

The default line length is 80 characters. Use the `[rule, options]` tuple to configure it:

```ts
import { md013Rule } from '@marky/compat-markdownlint'

const config: MarkyConfig = {
  plugins: [
    [md013Rule, { lineLength: 120 }],
  ],
}
```

## Configuring rule severity

Use `config.rules` to override severity per rule ID:

```ts
const config: MarkyConfig = {
  plugins: [md013Rule],
  rules: {
    'remark-lint:maximum-line-length': 'error',  // upgrade to error
    'marky:no-trailing-spaces': 'off',            // disable entirely
  },
}
```

Rule IDs follow the pattern `<source>:<rule-name>` as shown in `marky lint` output.

## Loading .markdownlintrc at runtime

You can also load an existing `.markdownlintrc` programmatically:

```ts
import { loadMarkdownlintConfig } from '@marky/compat-markdownlint'
import { lint } from '@marky/core'

const config = await loadMarkdownlintConfig(process.cwd())
const results = await lint(['README.md'], config)
```

This is useful for tools that wrap marky and want to respect an existing markdownlint config.
