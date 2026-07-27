package rules

import (
	"github.com/yuin/goldmark/ast"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD025 checks that the document has at most one level-1 heading.
type MD025 struct{}

// ID implements lint.Rule.
func (MD025) ID() string { return "MD025" }

// Description implements lint.Rule.
func (MD025) Description() string {
	return "Multiple top-level headings in the same document"
}

// Check implements lint.Rule.
func (MD025) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result
	h1Count := 0

	ast.Walk(ctx.Node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || n.Kind() != ast.KindHeading {
			return ast.WalkContinue, nil
		}
		if n.(*ast.Heading).Level == 1 {
			h1Count++
			if h1Count > 1 {
				results = append(results, lint.Result{
					File:     ctx.File,
					Line:     ctx.NodeLine(n),
					Col:      1,
					RuleID:   "MD025",
					Message:  "multiple top-level headings in the same document",
					Severity: lint.SeverityWarning,
				})
			}
		}
		return ast.WalkContinue, nil
	})
	return results
}
