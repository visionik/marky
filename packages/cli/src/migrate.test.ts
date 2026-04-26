import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import { run } from './cli.js'

function captureIO(): {
  io: { stdout: Writable; stderr: Writable; cwd: string }
  out: () => string
  err: () => string
} {
  let stdout = ''
  let stderr = ''
  return {
    io: {
      stdout: new Writable({
        write(chunk, _enc, cb): void {
          stdout += chunk.toString('utf8')
          cb()
        },
      }),
      stderr: new Writable({
        write(chunk, _enc, cb): void {
          stderr += chunk.toString('utf8')
          cb()
        },
      }),
      cwd: process.cwd(),
    },
    out: () => stdout,
    err: () => stderr,
  }
}

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'marky-migrate-test-'))
}

describe('marky migrate', () => {
  it('reports supported and unsupported rules from a .markdownlintrc', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(
        join(dir, '.markdownlintrc'),
        JSON.stringify({ MD013: true, MD041: true, MD999: true }),
      )
      const { io, out } = captureIO()
      io.cwd = dir
      const code = await run(['migrate', join(dir, '.markdownlintrc')], io)
      expect(code).toBe(0)
      // Supported rules listed
      expect(out()).toContain('MD013')
      expect(out()).toContain('MD041')
      // Unsupported rule reported
      expect(out()).toContain('MD999')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 0 even when all rules are unsupported', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD999: true }))
      const { io } = captureIO()
      io.cwd = dir
      const code = await run(['migrate', join(dir, '.markdownlintrc')], io)
      expect(code).toBe(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('generates a marky.config.ts file in the output directory', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD013: true, MD041: true }))
      const { io } = captureIO()
      io.cwd = dir
      await run(['migrate', join(dir, '.markdownlintrc')], io)
      const config = await readFile(join(dir, 'marky.config.ts'), 'utf8')
      expect(config).toContain('@marky/compat-markdownlint')
      expect(config).toContain('md013Rule')
      expect(config).toContain('md041Rule')
      expect(config).toContain('export default')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('summary line reports count of migrated and unrecognised rules', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(
        join(dir, '.markdownlintrc'),
        JSON.stringify({ MD013: true, MD041: true, MD999: true }),
      )
      const { io, out } = captureIO()
      io.cwd = dir
      await run(['migrate', join(dir, '.markdownlintrc')], io)
      // Should mention 2 migrated
      expect(out()).toMatch(/2.*(rule|migrat)/i)
      // Should mention 1 unrecognised
      expect(out()).toMatch(/1.*(manual|unsupport|unrecogni)/i)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('errors gracefully when the config file does not exist', async () => {
    const dir = await makeTempDir()
    try {
      const { io, err } = captureIO()
      io.cwd = dir
      const code = await run(['migrate', join(dir, 'nonexistent.json')], io)
      expect(code).toBe(1)
      expect(err()).toContain('error')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('reads .markdownlintrc from cwd when no path is given', async () => {
    const dir = await makeTempDir()
    try {
      await writeFile(join(dir, '.markdownlintrc'), JSON.stringify({ MD041: true }))
      const { io, out } = captureIO()
      io.cwd = dir
      const code = await run(['migrate'], io)
      expect(code).toBe(0)
      expect(out()).toContain('MD041')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exits 1 when no config file found and none specified', async () => {
    const dir = await makeTempDir()
    try {
      const { io, err } = captureIO()
      io.cwd = dir
      const code = await run(['migrate'], io)
      expect(code).toBe(1)
      expect(err()).toContain('error')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
