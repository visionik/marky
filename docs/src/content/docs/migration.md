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

18 markdownlint rules are supported. `marky migrate` maps all of them automatically.

| markdownlint rule | Status | marky equivalent | Package |
|---|---|---|---|
| MD001 (heading-increment) | ✅ | `md001Rule` | `@marky/compat-markdownlint` |
| MD005 (list-indent) | ✅ | `md005Rule` | `@marky/compat-markdownlint` |
| MD007 (unordered-list-indent) | ✅ | `md007Rule` (configurable `indent`, default 2) | `@marky/compat-markdownlint` |
| MD009 (trailing-spaces) | ✅ | `md009Rule` + `md009Fixer` | `@marky/core` |
| MD010 (no-hard-tabs) | ✅ | `md010Rule` + `md010Fixer` | `@marky/core` |
| MD012 (multiple-blank-lines) | ✅ | `md012Rule` + `md012Fixer` | `@marky/compat-markdownlint` |
| MD013 (line-length) | ✅ | `md013Rule` (configurable `lineLength`, default 80) | `@marky/compat-markdownlint` |
| MD022 (blanks-around-headings) | ✅ | `md022Rule` | `@marky/compat-markdownlint` |
| MD024 (no-duplicate-headings) | ✅ | `md024Rule` | `@marky/compat-markdownlint` |
| MD025 (single-top-level-heading) | ✅ | `md025Rule` | `@marky/compat-markdownlint` |
| MD026 (trailing-punctuation) | ✅ | `md026Rule` | `@marky/compat-markdownlint` |
| MD031 (blanks-around-fences) | ✅ | `md031Rule` | `@marky/compat-markdownlint` |
| MD032 (blanks-around-lists) | ✅ | `md032Rule` | `@marky/compat-markdownlint` |
| MD033 (no-inline-html) | ✅ | `md033Rule` | `@marky/compat-markdownlint` |
| MD034 (no-bare-urls) | ✅ | `md034Rule` | `@marky/compat-markdownlint` |
| MD040 (fenced-code-language) | ✅ | `md040Rule` | `@marky/compat-markdownlint` |
| MD041 (first-line-heading) | ✅ | `md041Rule` | `@marky/compat-markdownlint` |
| MD047 (single-trailing-newline) | ✅ | `md047Rule` + `md047Fixer` | `@marky/compat-markdownlint` |
| MD003 (heading-style) | ❌ Not yet implemented | — | — |
| MD036 (no-emphasis-as-heading) | ❌ Not yet implemented | — | — |

## Manual migration

If you prefer to set up manually:

```sh
pnpm add -D @marky/core @marky/cli @marky/compat-markdownlint
```

Create `marky.config.ts`:

```ts
import {
  md001Rule,
  md012Rule, md012Fixer,
  md013Rule,
  md022Rule,
  md024Rule,
  md025Rule,
  md031Rule,
  md040Rule,
  md041Rule,
  md047Rule, md047Fixer,
} from '@marky/compat-markdownlint'
import { md009Rule, md009Fixer, md010Rule, md010Fixer } from '@marky/core'
import type { MarkyConfig } from '@marky/core'

const config: MarkyConfig = {
  plugins: [
    md001Rule,   // heading levels increment by 1
    md009Rule,   // no trailing spaces
    md010Rule,   // no hard tabs
    md012Rule,   // no multiple consecutive blank lines
    md013Rule,   // line length ≤ 80
    md022Rule,   // blank lines around headings
    md024Rule,   // no duplicate heading text
    md025Rule,   // single top-level heading
    md031Rule,   // blank lines around fenced code blocks
    md040Rule,   // fenced code blocks have a language
    md041Rule,   // first line must be a heading
    md047Rule,   // file ends with a newline
  ],
  fixers: [
    md009Fixer,                              // strip trailing spaces
    md010Fixer,                              // replace tabs with spaces
    md012Fixer,                              // collapse multiple blank lines
    // (c) => md010Fixer(c, { tabSize: 2 }), // custom tab size
    md047Fixer,                              // append trailing newline
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
