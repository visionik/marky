import { readdir, stat } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { Command, CommanderError, Option } from 'commander'
import {
  lint,
  lintString,
  loadConfig,
  loadConfigFromFile,
  type LintResult,
  type MarkyConfig,
} from '@marky/core'
import type { Readable, Writable } from 'node:stream'
import { formatJson } from './reporters/json.js'
import { formatPretty } from './reporters/pretty.js'

/**
 * IO streams the CLI reads from / writes to. Defaults to the real
 * `process.std{in,out,err}` and `process.cwd()` when not supplied; tests
 * inject in-memory streams for assertions.
 */
export interface RunIO {
  stdin?: Readable
  stdout?: Writable
  stderr?: Writable
  cwd?: string
}

interface LintOptions {
  format: 'pretty' | 'json'
  config?: string
}

const VALID_FORMATS = ['pretty', 'json'] as const

async function readStream(stream: Readable): Promise<string> {
  let buf = ''
  for await (const chunk of stream) {
    buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
  }
  return buf
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkMarkdown(p)))
    } else if (e.isFile() && p.toLowerCase().endsWith('.md')) {
      out.push(p)
    }
  }
  return out
}

async function expandPath(p: string, cwd: string): Promise<string[]> {
  const abs = isAbsolute(p) ? p : resolve(cwd, p)
  let s
  try {
    s = await stat(abs)
  } catch {
    // Path doesn't exist; pass it through so the underlying read surfaces
    // a clear error to the user with the original-looking path.
    return [abs]
  }
  if (s.isDirectory()) return walkMarkdown(abs)
  return [abs]
}

interface LintInputs {
  results: LintResult[]
}

async function runLintAction(
  paths: string[],
  opts: LintOptions,
  io: Required<Pick<RunIO, 'stdin' | 'stdout' | 'stderr' | 'cwd'>>,
): Promise<number> {
  // Commander validates `--format` via `.choices()` before the action runs,
  // so opts.format is guaranteed to be 'pretty' or 'json' here.
  let config: MarkyConfig
  try {
    config = opts.config
      ? await loadConfigFromFile(
          isAbsolute(opts.config) ? opts.config : resolve(io.cwd, opts.config),
        )
      : await loadConfig(io.cwd)
  } catch (err) {
    io.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`)
    return 1
  }

  const inputs = await collectResults(paths, config, io)
  if (inputs === null) return 1

  const out = opts.format === 'json' ? formatJson(inputs.results) : formatPretty(inputs.results)
  io.stdout.write(out)
  if (!out.endsWith('\n')) io.stdout.write('\n')

  const hasError = inputs.results.some((r) => r.violations.some((v) => v.severity === 'error'))
  return hasError ? 1 : 0
}

async function collectResults(
  paths: string[],
  config: MarkyConfig,
  io: Required<Pick<RunIO, 'stdin' | 'stdout' | 'stderr' | 'cwd'>>,
): Promise<LintInputs | null> {
  if (paths.length === 1 && paths[0] === '-') {
    const content = await readStream(io.stdin)
    const result = await lintString(content, config, '<stdin>')
    return { results: [result] }
  }

  const files: string[] = []
  for (const p of paths) {
    if (p === '-') {
      io.stderr.write('error: "-" cannot be combined with file paths\n')
      return null
    }
    files.push(...(await expandPath(p, io.cwd)))
  }
  return { results: await lint(files, config) }
}

/**
 * Run the marky CLI with the given argv (excluding `node` and the script
 * path). Returns the process exit code rather than calling
 * `process.exit`, which makes the function trivially testable.
 *
 * @param argv - CLI arguments, e.g. `['lint', 'README.md', '--format', 'json']`.
 * @param io - Optional override for stdin/stdout/stderr/cwd.
 * @returns The exit code (0 on success, 1 on any error-severity violation
 *   or argument-parsing failure).
 */
export async function run(argv: string[], io: RunIO = {}): Promise<number> {
  const stdin = io.stdin ?? process.stdin
  const stdout = io.stdout ?? process.stdout
  const stderr = io.stderr ?? process.stderr
  const cwd = io.cwd ?? process.cwd()
  const ioFull = { stdin, stdout, stderr, cwd }

  const program = new Command()
  program
    .name('marky')
    .description('Markdown linter — fast, configurable, zero-config friendly')
    .exitOverride()
    .configureOutput({
      writeOut: (str) => stdout.write(str),
      writeErr: (str) => stderr.write(str),
    })

  let actionExitCode = 0

  program
    .command('lint')
    .description('Lint Markdown files. Pass file paths, directories, or "-" to read from stdin.')
    .argument('<paths...>', 'files, directories, or "-" for stdin')
    .addOption(
      new Option('-f, --format <format>', 'output format')
        .choices([...VALID_FORMATS])
        .default('pretty'),
    )
    .option('-c, --config <path>', 'explicit path to marky.config.ts')
    .action(async (paths: string[], opts: LintOptions) => {
      actionExitCode = await runLintAction(paths, opts, ioFull)
    })

  try {
    await program.parseAsync(argv, { from: 'user' })
  } catch (err) {
    if (err instanceof CommanderError) {
      // Help/version: code is 0 when commander wrote text and chose to
      // exit cleanly. Argument-validation errors carry exitCode 1.
      return err.exitCode ?? 1
    }
    stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`)
    return 1
  }

  return actionExitCode
}
