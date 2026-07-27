// Package rules contains the built-in crackdown lint rules.
package rules

import (
	"fmt"

	"github.com/yuin/goldmark/ast"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD001 checks that heading levels only ever increment by one at a time.
// Heading levels may decrease freely (e.g. H3 → H1 is valid).
type MD001 struct{}

// ID implements lint.Rule.
func (MD001) ID() string { return "MD001" }

// Description implements lint.Rule.
func (MD001) Description() string {
	return "Heading levels should only increment by one level at a time"
}

// Check implements lint.Rule.
func (MD001) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result
	prevLevel := 0

	ast.Walk(ctx.Node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || n.Kind() != ast.KindHeading {
			return ast.WalkContinue, nil
		}
		h := n.(*ast.Heading)
		level := h.Level
		if prevLevel > 0 && level > prevLevel+1 {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     ctx.NodeLine(n),
				Col:      1,
				RuleID:   "MD001",
				Message:  fmt.Sprintf("heading level %d skips level %d", level, prevLevel+1),
				Severity: lint.SeverityWarning,
			})
		}
		prevLevel = level
		return ast.WalkContinue, nil
	})
	return results
}
