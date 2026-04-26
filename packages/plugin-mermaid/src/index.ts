// @marky/plugin-mermaid — Mermaid diagram validation plugin
//
// Visits fenced code blocks tagged with `mermaid` and validates their
// content using @mermaid-js/parser. Parse failures are reported as lint
// violations with the offending code block's position.

import { lintRule } from 'unified-lint-rule'
import { visit } from 'unist-util-visit'
import type { Code, Root } from 'mdast'
import { parse } from '@mermaid-js/parser'
import type { MermaidParseError } from '@mermaid-js/parser'

export const PLUGIN_NAME = 'marky-lint-mermaid'

/** Diagram types supported by @mermaid-js/parser v1. */
type DiagramType =
  | 'info'
  | 'packet'
  | 'pie'
  | 'architecture'
  | 'gitGraph'
  | 'radar'
  | 'treemap'
  | 'treeView'
  | 'wardley'

/**
 * Map of leading keywords (case-insensitive) to the diagram type accepted
 * by `@mermaid-js/parser`. Diagram keywords not present here (e.g.
 * `flowchart`, `sequenceDiagram`, `classDiagram`) are unsupported by the
 * parser and are skipped without reporting a violation.
 */
const KEYWORD_TO_TYPE: ReadonlyMap<string, DiagramType> = new Map([
  ['info', 'info'],
  ['packet', 'packet'],
  ['packet-beta', 'packet'],
  ['pie', 'pie'],
  ['architecture', 'architecture'],
  ['architecture-beta', 'architecture'],
  ['gitgraph', 'gitGraph'],
  ['radar', 'radar'],
  ['radar-beta', 'radar'],
  ['treemap', 'treemap'],
  ['treeview', 'treeView'],
  ['wardley', 'wardley'],
])

/**
 * Detect a diagram type from raw mermaid text by inspecting the first
 * non-empty token. Returns null when the text contains no recognizable
 * keyword or the keyword is unsupported by the parser (e.g. `flowchart`,
 * `sequenceDiagram`, `classDiagram`).
 */
function detectDiagramType(text: string): DiagramType | null {
  const firstNonEmpty = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (firstNonEmpty === undefined) return null
  const keyword = firstNonEmpty.split(/\s+/)[0]?.toLowerCase() ?? ''
  return KEYWORD_TO_TYPE.get(keyword) ?? null
}

/**
 * `@mermaid-js/parser` exposes one literal-typed overload per diagram
 * type, which TypeScript cannot resolve from a union. Cast once to a
 * union-accepting signature so we can call it with `DiagramType`.
 */
const parseAny = parse as (type: DiagramType, text: string) => Promise<unknown>

/**
 * remark-lint rule that validates fenced ```mermaid``` code blocks using
 * `@mermaid-js/parser`. Parse errors are reported as messages with
 * `ruleId = "mermaid-syntax"` and `source = "marky"`, which `@marky/core`
 * surfaces as `marky:mermaid-syntax`.
 */
export const remarkLintMermaid = lintRule(
  { origin: 'marky:mermaid-syntax', url: undefined },
  async (tree: Root, file): Promise<void> => {
    const blocks: Code[] = []
    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'mermaid') blocks.push(node)
    })

    for (const node of blocks) {
      const value = node.value ?? ''
      const diagramType = detectDiagramType(value)
      if (diagramType === null) continue

      try {
        await parseAny(diagramType, value)
      } catch (err) {
        const message = (err as MermaidParseError | Error).message
        file.message(message, node.position)
      }
    }
  },
)

export default remarkLintMermaid
