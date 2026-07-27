package rules

import (
	"github.com/yuin/goldmark/ast"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD040 checks that every fenced code block specifies a language.
type MD040 struct{}

// ID implements lint.Rule.
func (MD040) ID() string { return "MD040" }

// Description implements lint.Rule.
func (MD040) Description() string {
	return "Fenced code blocks should have a language specified"
}

// Check implements lint.Rule.
func (MD040) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result

	ast.Walk(ctx.Node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || n.Kind() != ast.KindFencedCodeBlock {
			return ast.WalkContinue, nil
		}
		fcb := n.(*ast.FencedCodeBlock)
		if len(fcb.Language(ctx.Source)) == 0 {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     ctx.NodeLine(n),
				Col:      1,
				RuleID:   "MD040",
				Message:  "fenced code block has no language specified",
				Severity: lint.SeverityWarning,
			})
		}
		return ast.WalkContinue, nil
	})
	return results
}
