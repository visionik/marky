// Package reporters provides output formatters for lint results.
package reporters

import (
	"fmt"
	"io"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// Reporter formats lint results and writes them to an output stream.
type Reporter interface {
	Report(results []lint.Result) error
}

// New constructs a Reporter for the given format name.
// Supported formats: "pretty" (default), "json", "sarif".
func New(format string, w io.Writer) (Reporter, error) {
	switch format {
	case "pretty", "":
		return &PrettyReporter{w: w}, nil
	case "json":
		return &JSONReporter{w: w}, nil
	case "sarif":
		return &SARIFReporter{w: w, version: "dev"}, nil
	default:
		return nil, fmt.Errorf("unknown output format %q; choose pretty, json, or sarif", format)
	}
}
