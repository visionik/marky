import { describe, it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable, Writable } from 'node:stream'
import { run } from './cli.js'
import type { LintResult } from '@crackdown/core'

interface CapturedIO {
  stdout: string
  stderr: string
}

function makeIO(stdinContent?: string): {
  io: {
    stdin: Readable
    stdout: Writable
    stderr: Writable
    cwd: string
  }
  captured: CapturedIO
  cwdRef: { current: string }
} {
  const captured: CapturedIO = { stdout: '', stderr: '' }
  const stdout = new Writable({
    write(chunk, _enc, cb): void {
      captured.stdout += chunk.toString('utf8')
      cb()
    },
  })
  const stderr = new Writable({
    write(chunk, _enc, cb): void {
      captured.stderr += chunk.toString('utf8')
      cb()
    },
  })
  const stdin = stdinContent !== undefined ? Readable.from([stdinContent]) : Readable.from([])
  const cwdRef = { current: process.cwd() }
  return {
    io: { stdin, stdout, stderr, cwd: cwdRef.current },
    captured,
    cwdRef,
  }
}

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'marky-cli-test-'))
}

describe('crackdown lint — integration', () => {
  it('exits 0 for a clean Markdown file', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'clean.md')
      await writeFile(file, '# Hello world\n\nThis is fine.\n')
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', file], io)
      expect(code).toBe(0)
      expect(captured.stderr).toBe('')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 1 when an error-severity violation is reported', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'bad.md')
      await writeFile(file, '# Hello\n')

      // Inline plugin via crackdown.config.ts: emits a message that the rule
      // config bumps to "error" severity, triggering a non-zero exit.
      const config = `export default {
  plugins: [
    () => (_tree, file) => {
      const msg = file.message('always fails for tests')
      msg.source = 'test'
      msg.ruleId = 'always'
    },
  ],
  rules: { 'test:always': 'error' },
}\n`
      await writeFile(join(dir, 'crackdown.config.ts'), config)

      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', file], io)
      expect(code).toBe(1)
      expect(captured.stdout).toContain('always fails for tests')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('--format json produces parseable JSON to stdout', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# Hello\n')
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--format', 'json', file], io)
      expect(code).toBe(0)
      const parsed = JSON.parse(captured.stdout) as LintResult[]
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]?.file).toBe(file)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 1 when --format is invalid', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# Hello\n')
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--format', 'bogus', file], io)
      expect(code).toBe(1)
      // commander emits its error on stderr and writes a usage block.
      expect(captured.stderr.length).toBeGreaterThan(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('reads from stdin when path is "-"', async () => {
    const { io, captured } = makeIO('# Hello stdin\n')
    const code = await run(['lint', '--format', 'json', '-'], io)
    expect(code).toBe(0)
    const parsed = JSON.parse(captured.stdout) as LintResult[]
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.file).toBe('<stdin>')
  })

  it('--config overrides directory walk and applies the named config', async () => {
    const dir = await makeTempDir()
    const sub = join(dir, 'sub')
    await mkdir(sub, { recursive: true })
    try {
      const file = join(sub, 'a.md')
      await writeFile(file, '# Hello\n')
      const explicitConfig = join(dir, 'explicit.config.ts')
      await writeFile(
        explicitConfig,
        `export default {
  plugins: [
    () => (_tree, file) => {
      const msg = file.message('explicit-config rule fired')
      msg.source = 'explicit'
      msg.ruleId = 'rule'
    },
  ],
  rules: { 'explicit:rule': 'error' },
}\n`,
      )
      const { io, captured } = makeIO()
      io.cwd = sub
      const code = await run(['lint', '--config', explicitConfig, file], io)
      expect(code).toBe(1)
      expect(captured.stdout).toContain('explicit-config rule fired')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('walks directories for *.md files', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, 'a.md'), '# A\n')
      await mkdir(join(dir, 'nested'), { recursive: true })
      await writeFile(join(dir, 'nested', 'b.md'), '# B\n')
      // Not Markdown — must be ignored.
      await writeFile(join(dir, 'c.txt'), 'not markdown')
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--format', 'json', dir], io)
      expect(code).toBe(0)
      const parsed = JSON.parse(captured.stdout) as LintResult[]
      const filenames = parsed.map((r) => r.file).sort()
      expect(filenames).toEqual([join(dir, 'a.md'), join(dir, 'nested', 'b.md')])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('errors when "-" is combined with file paths', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# A\n')
      const { io, captured } = makeIO('# stdin\n')
      io.cwd = dir
      const code = await run(['lint', '-', file], io)
      expect(code).toBe(1)
      expect(captured.stderr).toContain('-')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('reports an error when the resolved config is invalid', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# A\n')
      await writeFile(join(dir, 'crackdown.config.ts'), `export default 'not-an-object'\n`)
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', file], io)
      expect(code).toBe(1)
      expect(captured.stderr).toContain('crackdown.config.ts')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 1 when invoked without a subcommand', async () => {
    const { io } = makeIO()
    const code = await run([], io)
    expect(code).toBe(1)
  })

  it('surfaces a read error for a non-existent file path', async () => {
    const dir = await makeTempDir()
    try {
      const missing = join(dir, 'does-not-exist.md')
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', missing], io)
      expect(code).toBe(1)
      // The CommanderError catch branch in run() reports through stderr.
      expect(captured.stderr).toContain('error:')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe('crackdown lint --fix', () => {
  it('rewrites file content and exits 0 when all violations are fixed', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'dirty.md')
      await writeFile(file, 'hello   \nworld\n')
      // Inline plugin + fixer: plugin detects trailing spaces so fixedCount is tracked
      await writeFile(
        join(dir, 'crackdown.config.ts'),
        `export default {
  plugins: [
    () => (_tree, vfile) => {
      String(vfile).split('\\n').forEach((line, i) => {
        if (line !== line.trimEnd()) vfile.message('trailing space', { line: i + 1, column: 1 })
      })
    },
  ],
  fixers: [(c) => c.split('\\n').map(l => l.trimEnd()).join('\\n')],
}\n`,
      )
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--fix', file], io)
      expect(code).toBe(0)
      const fixed = await readFile(file, 'utf8')
      expect(fixed).toBe('hello\nworld\n')
      expect(captured.stdout).toContain('fixed')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('--dry-run does not write files but reports what would change', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'dirty.md')
      const original = 'hello   \nworld\n'
      await writeFile(file, original)
      await writeFile(
        join(dir, 'crackdown.config.ts'),
        `export default {
  plugins: [
    () => (_tree, vfile) => {
      String(vfile).split('\\n').forEach((line, i) => {
        if (line !== line.trimEnd()) vfile.message('trailing space', { line: i + 1, column: 1 })
      })
    },
  ],
  fixers: [(c) => c.split('\\n').map(l => l.trimEnd()).join('\\n')],
}\n`,
      )
      const { io, captured } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--fix', '--dry-run', file], io)
      expect(code).toBe(0)
      // File must be unchanged
      const onDisk = await readFile(file, 'utf8')
      expect(onDisk).toBe(original)
      expect(captured.stdout).toContain('would fix')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 1 when unfixable error-severity violations remain after fixing', async () => {
    const dir = await makeTempDir()
    try {
      const file = join(dir, 'a.md')
      await writeFile(file, '# Hello\n')
      await writeFile(
        join(dir, 'crackdown.config.ts'),
        `export default {
  plugins: [
    () => (_tree, file) => {
      const msg = file.message('unfixable')
      msg.source = 'test'; msg.ruleId = 'unfixable'
    },
  ],
  rules: { 'test:unfixable': 'error' },
}\n`,
      )
      const { io } = makeIO()
      io.cwd = dir
      const code = await run(['lint', '--fix', file], io)
      expect(code).toBe(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('errors when stdin is used with --fix', async () => {
    const { io, captured } = makeIO('# Hello\n')
    const code = await run(['lint', '--fix', '-'], io)
    expect(code).toBe(1)
    expect(captured.stderr).toContain('stdin')
  })
})
