package rules

import (
	"strings"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD010 checks that no lines use hard tab characters.
type MD010 struct{}

// ID implements lint.Rule.
func (MD010) ID() string { return "MD010" }

// Description implements lint.Rule.
func (MD010) Description() string { return "Hard tabs" }

// Check implements lint.Rule.
func (MD010) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result
	for i, line := range ctx.Lines {
		if idx := strings.IndexByte(line, '\t'); idx >= 0 {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     i + 1,
				Col:      idx + 1,
				RuleID:   "MD010",
				Message:  "hard tab character",
				Severity: lint.SeverityWarning,
			})
		}
	}
	return results
}
