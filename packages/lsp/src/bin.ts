#!/usr/bin/env node
/**
 * crackdown-lsp — LSP server entry point.
 *
 * Starts the crackdown Language Server over stdio so any LSP-capable editor
 * (Neovim, Zed, Helix, Emacs, etc.) can connect to it.
 *
 * Usage: crackdown lsp
 *   or:  npx crackdown-lsp
 */
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js'
import { createServer } from './server.js'

const connection = createConnection(ProposedFeatures.all)
createServer(connection)
