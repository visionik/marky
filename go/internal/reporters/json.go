package reporters

import (
	"encoding/json"
	"io"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// JSONReporter outputs results as a JSON array.
type JSONReporter struct {
	w io.Writer
}

// Report implements Reporter.
func (r *JSONReporter) Report(results []lint.Result) error {
	if results == nil {
		results = []lint.Result{} // emit [] not null
	}
	enc := json.NewEncoder(r.w)
	enc.SetIndent("", "  ")
	return enc.Encode(results)
}
