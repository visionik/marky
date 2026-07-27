package reporters_test

import (
	"bytes"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/visionik/crackdown/go/internal/reporters"
	"github.com/visionik/crackdown/go/pkg/lint"
)

var sampleResults = []lint.Result{
	{File: "readme.md", Line: 5, Col: 1, RuleID: "MD009", Message: "trailing spaces (2)", Severity: lint.SeverityWarning},
	{File: "readme.md", Line: 10, Col: 3, RuleID: "MD001", Message: "heading level 3 skips level 2", Severity: lint.SeverityError},
}

// ── Factory ───────────────────────────────────────────────────────────────────

func TestNew_knownFormats(t *testing.T) {
	for _, format := range []string{"", "pretty", "json", "sarif"} {
		r, err := reporters.New(format, &bytes.Buffer{})
		require.NoError(t, err, "format: %q", format)
		assert.NotNil(t, r)
	}
}

func TestNew_unknownFormat(t *testing.T) {
	_, err := reporters.New("xml", &bytes.Buffer{})
	assert.Error(t, err)
}

// ── Pretty ────────────────────────────────────────────────────────────────────

func TestPrettyReporter_withResults(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("pretty", &buf)
	require.NoError(t, err)

	err = r.Report(sampleResults)
	require.NoError(t, err)

	out := buf.String()
	assert.Contains(t, out, "readme.md:5:1")
	assert.Contains(t, out, "MD009")
	assert.Contains(t, out, "trailing spaces")
	assert.Contains(t, out, "2 problem(s) found")
}

func TestPrettyReporter_noResults(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("pretty", &buf)
	require.NoError(t, err)

	err = r.Report(nil)
	require.NoError(t, err)
	assert.Contains(t, buf.String(), "No problems found")
}

// ── JSON ──────────────────────────────────────────────────────────────────────

func TestJSONReporter_withResults(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("json", &buf)
	require.NoError(t, err)

	require.NoError(t, r.Report(sampleResults))

	var got []lint.Result
	require.NoError(t, json.Unmarshal(buf.Bytes(), &got))
	require.Len(t, got, 2)
	assert.Equal(t, "MD009", got[0].RuleID)
	assert.Equal(t, lint.SeverityWarning, got[0].Severity)
}

func TestJSONReporter_emptyResults(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("json", &buf)
	require.NoError(t, err)
	require.NoError(t, r.Report(nil))

	// Must emit [] not null.
	assert.True(t, strings.Contains(buf.String(), "[]") || strings.HasPrefix(strings.TrimSpace(buf.String()), "["))
}

// ── SARIF ─────────────────────────────────────────────────────────────────────

func TestSARIFReporter_structure(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("sarif", &buf)
	require.NoError(t, err)
	require.NoError(t, r.Report(sampleResults))

	var doc map[string]interface{}
	require.NoError(t, json.Unmarshal(buf.Bytes(), &doc))

	assert.Equal(t, "2.1.0", doc["version"])
	runs, ok := doc["runs"].([]interface{})
	require.True(t, ok)
	require.Len(t, runs, 1)

	run := runs[0].(map[string]interface{})
	results, ok := run["results"].([]interface{})
	require.True(t, ok)
	assert.Len(t, results, 2)
}

func TestSARIFReporter_emptyResults(t *testing.T) {
	var buf bytes.Buffer
	r, err := reporters.New("sarif", &buf)
	require.NoError(t, err)
	require.NoError(t, r.Report(nil))

	var doc map[string]interface{}
	require.NoError(t, json.Unmarshal(buf.Bytes(), &doc))
	assert.Equal(t, "2.1.0", doc["version"])
}

func TestSARIFReporter_infoSeverity(t *testing.T) {
	// Covers the SeverityInfo → "note" branch in sarifLevel.
	var buf bytes.Buffer
	r, err := reporters.New("sarif", &buf)
	require.NoError(t, err)
	infoResult := []lint.Result{
		{File: "f.md", Line: 1, Col: 1, RuleID: "MD047", Message: "msg", Severity: lint.SeverityInfo},
	}
	require.NoError(t, r.Report(infoResult))

	var doc map[string]interface{}
	require.NoError(t, json.Unmarshal(buf.Bytes(), &doc))
	runs := doc["runs"].([]interface{})
	run := runs[0].(map[string]interface{})
	results := run["results"].([]interface{})
	result := results[0].(map[string]interface{})
	assert.Equal(t, "note", result["level"])
}

func TestPrettyReporter_allSeverities(t *testing.T) {
	// Covers all severity label branches (non-colour path).
	mixed := []lint.Result{
		{File: "f.md", Line: 1, Col: 1, RuleID: "MD001", Message: "e", Severity: lint.SeverityError},
		{File: "f.md", Line: 2, Col: 1, RuleID: "MD009", Message: "w", Severity: lint.SeverityWarning},
		{File: "f.md", Line: 3, Col: 1, RuleID: "MD010", Message: "i", Severity: lint.SeverityInfo},
	}
	var buf bytes.Buffer
	r, err := reporters.New("pretty", &buf)
	require.NoError(t, err)
	require.NoError(t, r.Report(mixed))
	out := buf.String()
	assert.Contains(t, out, "error")
	assert.Contains(t, out, "warning")
	assert.Contains(t, out, "info")
}

func TestPrettyReporter_pipeIsNotTerminal(t *testing.T) {
	// Exercises isTerminal with an actual *os.File that is not a character device.
	r, w, err := os.Pipe()
	require.NoError(t, err)
	defer r.Close()
	defer w.Close()

	rep, repErr := reporters.New("pretty", w)
	require.NoError(t, repErr)
	require.NoError(t, rep.Report(nil))
}
