# @marky/compat-markdownlint

markdownlint compatibility layer for marky. Loads `.markdownlintrc` /
`.markdownlint.json` config files and translates enabled rules into marky
plugins.

## Usage

```ts
import { loadMarkdownlintConfig } from '@marky/compat-markdownlint'
import { lint } from '@marky/core'

const config = await loadMarkdownlintConfig(process.cwd())
const results = await lint(['README.md'], config)
```

Or use rules individually:

```ts
import { md013Rule, md041Rule } from '@marky/compat-markdownlint'
import { lintString } from '@marky/core'

const result = await lintString(content, {
  plugins: [md013Rule, md041Rule],
})
```

## Rule mapping

| markdownlint rule | Status | marky equivalent |
|---|---|---|
| MD001 (heading-increment) | ✅ Supported | `md001Rule` |
| MD009 (trailing-spaces) | ✅ Supported | `md009Rule` from `@marky/core` + `md009Fixer` |
| MD010 (no-hard-tabs) | ✅ Supported | `md010Rule` from `@marky/core` + `md010Fixer` |
| MD012 (multiple-blank-lines) | ✅ Supported | `md012Rule` + `md012Fixer` (collapse) |
| MD013 (line-length) | ✅ Supported | `md013Rule` (default: 80 chars) |
| MD022 (blanks-around-headings) | ✅ Supported | `md022Rule` |
| MD025 (single-top-level-heading) | ✅ Supported | `md025Rule` |
| MD026 (trailing-punctuation) | ✅ Supported | `md026Rule` |
| MD031 (blanks-around-fences) | ✅ Supported | `md031Rule` |
| MD032 (blanks-around-lists) | ✅ Supported | `md032Rule` |
| MD033 (no-inline-html) | ✅ Supported | `md033Rule` |
| MD040 (fenced-code-language) | ✅ Supported | `md040Rule` |
| MD041 (first-line-heading) | ✅ Supported | `md041Rule` |
| MD047 (single-trailing-newline) | ✅ Supported | `md047Rule` + `md047Fixer` |
| MD005 (list-indent) | ✅ Supported | `md005Rule` |
| MD007 (unordered-list-indent) | ✅ Supported | `md007Rule` (configurable `indent`, default: 2) |
| MD024 (no-duplicate-headings) | ✅ Supported | `md024Rule` |
| MD034 (no-bare-urls) | ✅ Supported | `md034Rule` |
| MD003 (heading-style) | ❌ Not yet implemented | — |
| MD036 (no-emphasis-as-heading) | ❌ Not yet implemented | — |

## Config file format

Standard markdownlint JSON format:

```json
{
  "MD013": true,
  "MD041": true
}
```

Rules set to `false` are skipped. Unrecognised rule IDs are ignored silently.
