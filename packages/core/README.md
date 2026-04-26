# @marky/core

The lint pipeline that powers the [marky](https://github.com/deftco/marky)
CLI. You can also use it directly as a Node.js library inside build tools,
editors, or other automation.

## Install

```bash
pnpm add @marky/core
```

## Programmatic API

`@marky/core` exposes two main entry points: `lint` for files on disk and
`lintString` for in-memory content. Both accept an optional `MarkyConfig`.

```ts
import { lint, lintString, type MarkyConfig } from '@marky/core'

const config: MarkyConfig = {
  rules: {
    'remark-lint:no-heading-punctuation': 'error',
  },
  plugins: [],
}

// Lint files on disk.
const results = await lint(['README.md', 'docs/intro.md'], config)
for (const result of results) {
  console.log(result.file, result.violations.length)
}

// Lint a string in memory.
const single = await lintString('# Hello!\n', config, 'README.md')
console.log(single.violations)
```

### Loading configuration from `marky.config.ts`

`loadConfig(cwd)` walks up the directory tree from `cwd` looking for a
`marky.config.ts` file and returns an empty config if none is found.

```ts
import { loadConfig, lint } from '@marky/core'

const config = await loadConfig(process.cwd())
const results = await lint(['README.md'], config)
```

## Exports

- `lint(files, config?)` — lint a list of files
- `lintString(content, config?, filename?)` — lint a Markdown string
- `lintFile(file, config?)` — lint a single file
- `loadConfig(cwd)` — locate and load `marky.config.ts`
- `loadConfigFromFile(path)` — load a specific config file
- Types: `MarkyConfig`, `LintResult`, `LintViolation`, `Plugin`, `Severity`,
  `RuleSeverity`
