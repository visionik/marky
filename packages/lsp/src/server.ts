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
import { loadConfig, lintStringFix, type MarkyConfig } from '@crackdown/core'
import { validateMarkdown, workspaceRootFromUri } from './validate.js'

/** Debounce delay for as-you-type validation (ms). */
const DEBOUNCE_MS = 300

/** Marky config filename that triggers a reload when changed. */
const CONFIG_FILENAME = 'crackdown.config.ts'

/**
 * Create and attach a crackdown LSP server to the given connection.
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

  /** Watch crackdown.config.ts and invalidate the cache on change. */
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
      serverInfo: { name: 'crackdown', version: '0.1.0' },
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

  // codeAction provider — applies all registered fixers as a single
  // "Fix all fixable issues" action backed by a real WorkspaceEdit.
  connection.onCodeAction(async (params): Promise<(CodeAction | Command)[]> => {
    if (params.context.diagnostics.length === 0) return []

    const doc = documents.get(params.textDocument.uri)
    if (!doc) return []

    const root = workspaceRootFromUri(doc.uri)
    const config = await getConfig(root)

    // Only offer a fix action when fixers are actually configured.
    if (!config.fixers || config.fixers.length === 0) return []

    const content = doc.getText()
    const fixResult = await lintStringFix(content, config, doc.uri)

    // Nothing to fix — don't offer the action.
    if (fixResult.fixedCount === 0 || fixResult.fixed === content) return []

    // Replace the entire document with the fixed content.
    const fullRange = {
      start: doc.positionAt(0),
      end: doc.positionAt(content.length),
    }

    const noun = fixResult.fixedCount === 1 ? 'issue' : 'issues'
    return [
      {
        title: `crackdown: fix all fixable ${noun} (${fixResult.fixedCount} fixed)`,
        kind: CodeActionKind.QuickFix,
        diagnostics: params.context.diagnostics,
        isPreferred: true,
        edit: {
          changes: {
            [params.textDocument.uri]: [{ range: fullRange, newText: fixResult.fixed }],
          },
        },
      },
    ]
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
