package rules

import (
	"github.com/yuin/goldmark/ast"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD041 checks that the first block in a document is a level-1 heading.
type MD041 struct{}

// ID implements lint.Rule.
func (MD041) ID() string { return "MD041" }

// Description implements lint.Rule.
func (MD041) Description() string {
	return "First line should be a top-level heading"
}

// Check implements lint.Rule.
func (MD041) Check(ctx *lint.Context) []lint.Result {
	first := ctx.Node.FirstChild()
	if first == nil {
		return nil // empty document
	}
	// Allow the document to start with an H1 heading.
	if first.Kind() == ast.KindHeading && first.(*ast.Heading).Level == 1 {
		return nil
	}
	return []lint.Result{{
		File:     ctx.File,
		Line:     1,
		Col:      1,
		RuleID:   "MD041",
		Message:  "first line should be a top-level (H1) heading",
		Severity: lint.SeverityWarning,
	}}
}
