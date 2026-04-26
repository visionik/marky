#!/usr/bin/env node
/**
 * marky-lsp — LSP server entry point.
 *
 * Starts the marky Language Server over stdio so any LSP-capable editor
 * (Neovim, Zed, Helix, Emacs, etc.) can connect to it.
 *
 * Usage: marky lsp
 *   or:  npx marky-lsp
 */
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js'
import { createServer } from './server.js'

const connection = createConnection(ProposedFeatures.all)
createServer(connection)
