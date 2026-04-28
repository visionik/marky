package lint

import "github.com/yuin/goldmark/ast"

// Context holds everything a Rule needs to lint a Markdown document.
// It is built once per file by the Linter and passed to every Rule.
type Context struct {
	// File is the path used in diagnostic output.
	File string
	// Source is the raw file bytes.
	Source []byte
	// Lines contains the document lines split on '\n' with '\r' stripped.
	// Line numbers are 1-based; Lines[0] is line 1.
	Lines []string
	// Node is the goldmark document root (parsed AST).
	Node ast.Node
}

// LineAt returns the 1-based line number corresponding to the given byte
// offset in Source. Returns 1 for offsets ≤ 0.
func (c *Context) LineAt(offset int) int {
	if offset <= 0 {
		return 1
	}
	n := 1
	for i := 0; i < offset && i < len(c.Source); i++ {
		if c.Source[i] == '\n' {
			n++
		}
	}
	return n
}

// NodeLine returns the 1-based start line of the given AST node,
// derived from its Lines() segments. Returns 1 when position is unknown.
func (c *Context) NodeLine(n ast.Node) int {
	if segs := n.Lines(); segs != nil && segs.Len() > 0 {
		return c.LineAt(segs.At(0).Start)
	}
	return 1
}

// Rule is the interface every lint rule must implement.
type Rule interface {
	// ID returns the rule identifier, e.g. "MD009".
	ID() string
	// Description returns a human-readable description of the rule.
	Description() string
	// Check runs the rule against ctx and returns any violations found.
	Check(ctx *Context) []Result
}
