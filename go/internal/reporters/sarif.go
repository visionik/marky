package reporters

import (
	"encoding/json"
	"io"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// SARIFReporter outputs results in SARIF 2.1.0 format.
type SARIFReporter struct {
	w       io.Writer
	version string
}

// Report implements Reporter.
func (r *SARIFReporter) Report(results []lint.Result) error {
	// Collect unique rule IDs from results.
	seen := make(map[string]bool)
	var sarifRules []sarifRule
	for _, res := range results {
		if !seen[res.RuleID] {
			seen[res.RuleID] = true
			sarifRules = append(sarifRules, sarifRule{
				ID:               res.RuleID,
				ShortDescription: sarifMessage{Text: res.Message},
			})
		}
	}
	if sarifRules == nil {
		sarifRules = []sarifRule{}
	}

	sarifResults := make([]sarifResult, 0, len(results))
	for _, res := range results {
		sarifResults = append(sarifResults, sarifResult{
			RuleID:  res.RuleID,
			Level:   sarifLevel(res.Severity),
			Message: sarifMessage{Text: res.Message},
			Locations: []sarifLocation{{
				PhysicalLocation: sarifPhysLoc{
					ArtifactLocation: sarifArtLoc{URI: res.File},
					Region: sarifRegion{
						StartLine:   res.Line,
						StartColumn: res.Col,
					},
				},
			}},
		})
	}

	ver := r.version
	if ver == "" {
		ver = "dev"
	}

	log := sarifLog{
		Schema:  "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
		Version: "2.1.0",
		Runs: []sarifRun{{
			Tool: sarifTool{
				Driver: sarifDriver{
					Name:    "crackdown",
					Version: ver,
					Rules:   sarifRules,
				},
			},
			Results: sarifResults,
		}},
	}

	enc := json.NewEncoder(r.w)
	enc.SetIndent("", "  ")
	return enc.Encode(log)
}

func sarifLevel(s lint.Severity) string {
	switch s {
	case lint.SeverityError:
		return "error"
	case lint.SeverityWarning:
		return "warning"
	default:
		return "note"
	}
}

// ── SARIF schema types ────────────────────────────────────────────────────────

type sarifLog struct {
	Schema  string     `json:"$schema"`
	Version string     `json:"version"`
	Runs    []sarifRun `json:"runs"`
}

type sarifRun struct {
	Tool    sarifTool     `json:"tool"`
	Results []sarifResult `json:"results"`
}

type sarifTool struct {
	Driver sarifDriver `json:"driver"`
}

type sarifDriver struct {
	Name    string      `json:"name"`
	Version string      `json:"version"`
	Rules   []sarifRule `json:"rules"`
}

type sarifRule struct {
	ID               string       `json:"id"`
	ShortDescription sarifMessage `json:"shortDescription"`
}

type sarifResult struct {
	RuleID    string          `json:"ruleId"`
	Level     string          `json:"level"`
	Message   sarifMessage    `json:"message"`
	Locations []sarifLocation `json:"locations"`
}

type sarifMessage struct {
	Text string `json:"text"`
}

type sarifLocation struct {
	PhysicalLocation sarifPhysLoc `json:"physicalLocation"`
}

type sarifPhysLoc struct {
	ArtifactLocation sarifArtLoc `json:"artifactLocation"`
	Region           sarifRegion `json:"region"`
}

type sarifArtLoc struct {
	URI string `json:"uri"`
}

type sarifRegion struct {
	StartLine   int `json:"startLine"`
	StartColumn int `json:"startColumn"`
}
