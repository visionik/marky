/**
 * @crackdown/vscode — VS Code extension for the crackdown Markdown linter.
 *
 * Activates for Markdown files and spawns @crackdown/lsp as a child process
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

/** Resolve the path to the crackdown-lsp binary from this extension. */
function resolveLspBin(): string {
  // In a bundled CJS VS Code extension, __dirname is the dist/ folder.
  // @crackdown/lsp is a workspace sibling resolved via the package's node_modules.
  const lspPkg = (require as NodeRequire).resolve('@crackdown/lsp/package.json') as string
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
      fileEvents: undefined, // crackdown-lsp watches crackdown.config.ts internally
    },
  }

  client = new LanguageClient(
    'crackdown',
    'crackdown Markdown Linter',
    serverOptions,
    clientOptions,
  )
  void client.start()
  context.subscriptions.push({ dispose: () => void client?.stop() })
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}
