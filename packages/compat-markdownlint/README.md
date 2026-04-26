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
| MD001 (heading-increment) | ✅ Supported | `md001Rule` from `@marky/compat-markdownlint` |
| MD009 (trailing-spaces) | ✅ Supported | `md009Rule` from `@marky/core` |
| MD010 (no-hard-tabs) | ✅ Supported | `md010Rule` from `@marky/core` |
| MD013 (line-length) | ✅ Supported | `md013Rule` (default: 80 chars) |
| MD022 (blanks-around-headings) | ✅ Supported | `md022Rule` from `@marky/compat-markdownlint` |
| MD041 (first-line-heading) | ✅ Supported | `md041Rule` |
| MD005 (list-indent) | ❌ Not yet implemented | — |
| MD007 (unordered-list-style) | ❌ Not yet implemented | — |
| MD031 (fenced-code-blocks) | ❌ Not yet implemented | — |
| MD032 (list-surrounded-blanks) | ❌ Not yet implemented | — |

## Config file format

Standard markdownlint JSON format:

```json
{
  "MD013": true,
  "MD041": true
}
```

Rules set to `false` are skipped. Unrecognised rule IDs are ignored silently.
