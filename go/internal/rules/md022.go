package rules

import (
	"github.com/yuin/goldmark/ast"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD022 checks that every heading is surrounded by blank lines.
// The first heading in the document does not need a blank line before it.
// The last heading does not need a blank line after it.
// Only top-level children of the document are inspected.
type MD022 struct{}

// ID implements lint.Rule.
func (MD022) ID() string { return "MD022" }

// Description implements lint.Rule.
func (MD022) Description() string {
	return "Headings should be surrounded by blank lines"
}

// Check implements lint.Rule.
func (MD022) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result
	for c := ctx.Node.FirstChild(); c != nil; c = c.NextSibling() {
		if c.Kind() != ast.KindHeading {
			continue
		}
		line := ctx.NodeLine(c)

		// Blank line required before heading unless it is the very first block.
		if c.PreviousSibling() != nil && !c.HasBlankPreviousLines() {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     line,
				Col:      1,
				RuleID:   "MD022",
				Message:  "heading should be preceded by a blank line",
				Severity: lint.SeverityWarning,
			})
		}

		// Blank line required after heading unless it is the very last block.
		if next := c.NextSibling(); next != nil && !next.HasBlankPreviousLines() {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     line,
				Col:      1,
				RuleID:   "MD022",
				Message:  "heading should be followed by a blank line",
				Severity: lint.SeverityWarning,
			})
		}
	}
	return results
}
