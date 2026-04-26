/**
 * @marky/vscode — VS Code extension for the marky Markdown linter.
 *
 * Activates for Markdown files and spawns @marky/lsp as a child process
 * over stdio, then connects to it via vscode-languageclient.
 */
import type { ExtensionContext } from 'vscode'
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node.js'
import * as path from 'node:path'

let client: LanguageClient | undefined

/** Resolve the path to the marky-lsp binary from this extension. */
function resolveLspBin(): string {
  // In a bundled CJS VS Code extension, __dirname is the dist/ folder.
  // @marky/lsp is a workspace sibling resolved via the package's node_modules.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lspPkg = (require as NodeRequire).resolve('@marky/lsp/package.json') as string
  const lspDir = path.dirname(lspPkg)
  return path.join(lspDir, 'dist', 'bin.js')
}

export function activate(context: ExtensionContext): void {
  const serverModule = resolveLspBin()

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'markdown' }],
    synchronize: {
      fileEvents: undefined, // marky-lsp watches marky.config.ts internally
    },
  }

  client = new LanguageClient('marky', 'marky Markdown Linter', serverOptions, clientOptions)
  void client.start()
  context.subscriptions.push({ dispose: () => void client?.stop() })
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}
