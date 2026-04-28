package rules

import (
	"fmt"
	"strings"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD009 checks that no lines have trailing whitespace.
type MD009 struct{}

// ID implements lint.Rule.
func (MD009) ID() string { return "MD009" }

// Description implements lint.Rule.
func (MD009) Description() string { return "Trailing spaces" }

// Check implements lint.Rule.
func (MD009) Check(ctx *lint.Context) []lint.Result {
	var results []lint.Result
	for i, line := range ctx.Lines {
		trimmed := strings.TrimRight(line, " \t")
		if len(line) != len(trimmed) {
			results = append(results, lint.Result{
				File:     ctx.File,
				Line:     i + 1,
				Col:      len(trimmed) + 1,
				RuleID:   "MD009",
				Message:  fmt.Sprintf("trailing spaces (%d)", len(line)-len(trimmed)),
				Severity: lint.SeverityWarning,
			})
		}
	}
	return results
}
