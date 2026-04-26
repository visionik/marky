import {
  type Connection,
  TextDocuments,
  TextDocumentSyncKind,
  type InitializeResult,
  CodeActionKind,
  type CodeAction,
  type Command,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { watch, type FSWatcher } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, type MarkyConfig } from '@marky/core'
import { validateMarkdown, workspaceRootFromUri } from './validate.js'

/** Debounce delay for as-you-type validation (ms). */
const DEBOUNCE_MS = 300

/** Marky config filename that triggers a reload when changed. */
const CONFIG_FILENAME = 'marky.config.ts'

/**
 * Create and attach a marky LSP server to the given connection.
 *
 * @param connection - The LSP connection (stdio, node-ipc, etc.)
 * @returns A `dispose` function that tears down the server cleanly.
 */
export function createServer(connection: Connection): () => void {
  const documents = new TextDocuments(TextDocument)

  // Config cache: workspace root → MarkyConfig
  const configCache = new Map<string, MarkyConfig>()
  // Debounce timers: document URI → timer handle
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  // File watchers: workspace root → watcher
  const watchers = new Map<string, FSWatcher>()

  /** Get (or load and cache) the config for a workspace root. */
  async function getConfig(root: string): Promise<MarkyConfig> {
    if (!configCache.has(root)) {
      const config = await loadConfig(root)
      configCache.set(root, config)
      watchConfig(root)
    }
    return configCache.get(root) ?? {}
  }

  /** Watch marky.config.ts and invalidate the cache on change. */
  function watchConfig(root: string): void {
    if (watchers.has(root)) return
    const configPath = join(root, CONFIG_FILENAME)
    try {
      const watcher = watch(configPath, () => {
        configCache.delete(root)
        // Re-validate all open documents in this workspace
        for (const doc of documents.all()) {
          const docRoot = workspaceRootFromUri(doc.uri)
          if (docRoot === root) {
            void scheduleValidation(doc)
          }
        }
      })
      watchers.set(root, watcher)
    } catch {
      // Config file may not exist yet — ignore watch errors
    }
  }

  /** Schedule debounced validation for a document. */
  async function scheduleValidation(document: TextDocument): Promise<void> {
    const existing = debounceTimers.get(document.uri)
    if (existing !== undefined) clearTimeout(existing)

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        debounceTimers.delete(document.uri)
        void doValidate(document).then(resolve)
      }, DEBOUNCE_MS)
      debounceTimers.set(document.uri, timer)
    })
  }

  /** Run validation immediately (no debounce). */
  async function doValidate(document: TextDocument): Promise<void> {
    const root = workspaceRootFromUri(document.uri)
    const config = await getConfig(root)
    const diagnostics = await validateMarkdown(document.getText(), document.uri, config)
    connection.sendDiagnostics({ uri: document.uri, diagnostics })
  }

  // ── LSP lifecycle ──────────────────────────────────────────────────────

  connection.onInitialize(
    (): InitializeResult => ({
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        codeActionProvider: {
          codeActionKinds: [CodeActionKind.QuickFix],
        },
      },
      serverInfo: { name: 'marky', version: '0.1.0' },
    }),
  )

  // Validate on open and save (immediate — no debounce)
  documents.onDidOpen(({ document }) => {
    void doValidate(document)
  })

  documents.onDidSave(({ document }) => {
    void doValidate(document)
  })

  // Validate on change (debounced at 300 ms)
  documents.onDidChangeContent(({ document }) => {
    void scheduleValidation(document)
  })

  // Clear diagnostics when a document is closed
  documents.onDidClose(({ document }) => {
    connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
    const timer = debounceTimers.get(document.uri)
    if (timer !== undefined) clearTimeout(timer)
    debounceTimers.delete(document.uri)
  })

  // codeAction provider: placeholder — actual quick-fix actions depend on
  // the fixers registered in marky.config.ts and are resolved at action time.
  connection.onCodeAction((params): (CodeAction | Command)[] => {
    // For each error/warning in the requested range, offer a generic
    // "Run marky --fix" action. Full per-rule fixers will be wired in
    // a follow-up when the fix protocol matures.
    const actions: CodeAction[] = []
    for (const diag of params.context.diagnostics) {
      actions.push({
        title: `marky: fix '${diag.source ?? 'violation'}'`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        isPreferred: false,
        // Actual workspace edits will be populated when fix transformers
        // are exposed via the @marky/core programmatic API.
      })
    }
    return actions
  })

  documents.listen(connection)
  connection.listen()

  return () => {
    for (const timer of debounceTimers.values()) clearTimeout(timer)
    for (const watcher of watchers.values()) watcher.close()
    debounceTimers.clear()
    watchers.clear()
    configCache.clear()
  }
}
