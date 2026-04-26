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
| MD013 (line-length) | ✅ Supported | `md013Rule` (default: 80 chars) |
| MD041 (first-line-heading) | ✅ Supported | `md041Rule` |
| MD001 (heading-levels) | ❌ Not yet implemented | — |
| MD009 (trailing-spaces) | ❌ Not yet implemented | — |
| MD010 (no-hard-tabs) | ❌ Not yet implemented | — |
| MD022 (blanks-around-headings) | ❌ Not yet implemented | — |

## Config file format

Standard markdownlint JSON format:

```json
{
  "MD013": true,
  "MD041": true
}
```

Rules set to `false` are skipped. Unrecognised rule IDs are ignored silently.
