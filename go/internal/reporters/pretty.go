package reporters

import (
	"fmt"
	"io"
	"os"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// PrettyReporter outputs human-readable, optionally colourised diagnostics.
type PrettyReporter struct {
	w io.Writer
}

// Report implements Reporter.
func (r *PrettyReporter) Report(results []lint.Result) error {
	color := isTerminal(r.w) && os.Getenv("NO_COLOR") == ""
	for _, res := range results {
		sev := severityLabel(res.Severity, color)
		rid := res.RuleID
		if color {
			rid = "\033[36m" + rid + "\033[0m" // cyan
		}
		fmt.Fprintf(r.w, "%s:%d:%d  %s  %s  %s\n",
			res.File, res.Line, res.Col, sev, rid, res.Message)
	}
	if len(results) > 0 {
		fmt.Fprintf(r.w, "\n%d problem(s) found\n", len(results))
	} else {
		fmt.Fprintln(r.w, "No problems found")
	}
	return nil
}

func severityLabel(s lint.Severity, color bool) string {
	if !color {
		return string(s)
	}
	switch s {
	case lint.SeverityError:
		return "\033[31merror\033[0m"
	case lint.SeverityWarning:
		return "\033[33mwarning\033[0m"
	default:
		return string(s)
	}
}

// isTerminal reports whether w is a character device (a real terminal).
func isTerminal(w io.Writer) bool {
	f, ok := w.(*os.File)
	if !ok {
		return false
	}
	st, err := f.Stat()
	if err != nil {
		return false
	}
	return st.Mode()&os.ModeCharDevice != 0
}
