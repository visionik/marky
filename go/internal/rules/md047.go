package rules

import (
	"github.com/visionik/crackdown/go/pkg/lint"
)

// MD047 checks that every file ends with exactly one newline character.
type MD047 struct{}

// ID implements lint.Rule.
func (MD047) ID() string { return "MD047" }

// Description implements lint.Rule.
func (MD047) Description() string {
	return "Files should end with a single newline character"
}

// Check implements lint.Rule.
func (MD047) Check(ctx *lint.Context) []lint.Result {
	if len(ctx.Source) == 0 {
		return nil
	}
	last := ctx.Source[len(ctx.Source)-1]
	if last == '\n' {
		return nil
	}
	return []lint.Result{{
		File:     ctx.File,
		Line:     len(ctx.Lines),
		Col:      len(ctx.Lines[len(ctx.Lines)-1]) + 1,
		RuleID:   "MD047",
		Message:  "file should end with a single newline character",
		Severity: lint.SeverityWarning,
	}}
}
