// Package lint provides the public linting API for crackdown.
package lint

// Severity indicates how serious a lint violation is.
type Severity string

const (
	// SeverityError indicates a violation that must be fixed.
	SeverityError Severity = "error"
	// SeverityWarning indicates a violation that should be fixed.
	SeverityWarning Severity = "warning"
	// SeverityInfo indicates an informational diagnostic.
	SeverityInfo Severity = "info"
)

// Result represents a single lint diagnostic emitted by a Rule.
type Result struct {
	File     string   `json:"file"`
	Line     int      `json:"line"`
	Col      int      `json:"col"`
	RuleID   string   `json:"ruleId"`
	Message  string   `json:"message"`
	Severity Severity `json:"severity"`
}
