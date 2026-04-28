package rules_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/visionik/crackdown/go/internal/rules"
	"github.com/visionik/crackdown/go/pkg/lint"
)

// ── MD001 ─────────────────────────────────────────────────────────────────────

func TestMD001(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"valid sequence h1 h2 h3", "# H1\n\n## H2\n\n### H3\n", 0},
		{"h1 directly to h3", "# H1\n\n### H3\n", 1},
		{"h2 directly to h4", "## H2\n\n#### H4\n", 1},
		{"valid reset to h1", "## H2\n\n# H1\n\n## H2 again\n", 0},
		{"no headings", "just a paragraph\n", 0},
		{"single heading", "# Only one\n", 0},
	}
	r := rules.MD001{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
			for _, res := range results {
				assert.Equal(t, "MD001", res.RuleID)
				assert.Equal(t, lint.SeverityWarning, res.Severity)
			}
		})
	}
}

// ── MD009 ─────────────────────────────────────────────────────────────────────

func TestMD009(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
		wantCol int // column of first result (0 = skip check)
	}{
		{"clean lines", "# Hello\n\nParagraph\n", 0, 0},
		{"trailing space", "hello   \nworld\n", 1, 6},
		{"trailing tab", "hello\t\nworld\n", 1, 6},
		{"multiple lines with spaces", "a  \nb  \nc\n", 2, 0},
		{"only spaces on line", "   \ntext\n", 1, 1},
	}
	r := rules.MD009{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
			if tt.wantCol > 0 && len(results) > 0 {
				assert.Equal(t, tt.wantCol, results[0].Col)
			}
		})
	}
}

// ── MD010 ─────────────────────────────────────────────────────────────────────

func TestMD010(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"no tabs", "# Hello\n\nParagraph\n", 0},
		{"tab in line", "hello\tthere\n", 1},
		{"tab at start", "\tcontent\n", 1},
		{"multiple lines with tabs", "a\tb\nc\td\n", 2},
	}
	r := rules.MD010{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
		})
	}
}

// ── MD022 ─────────────────────────────────────────────────────────────────────

func TestMD022(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{
			"proper spacing",
			"# H1\n\nParagraph\n\n## H2\n\nMore text\n",
			0,
		},
		{
			"heading at start no blank before needed",
			"# H1\n\nParagraph\n",
			0,
		},
		{
			"heading at end no blank after needed",
			"Paragraph\n\n## H2\n",
			0,
		},
		{
			"missing blank before heading",
			"Paragraph\n## H2\n",
			1,
		},
		{
			"missing blank after heading",
			"# H1\nParagraph\n",
			1,
		},
		{
			"missing both blank lines",
			"Paragraph\n## H2\nMore text\n",
			2,
		},
		{
			"only heading",
			"# H1\n",
			0,
		},
	}
	r := rules.MD022{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen, "input: %q", tt.input)
		})
	}
}

// ── MD025 ─────────────────────────────────────────────────────────────────────

func TestMD025(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"single h1", "# Title\n\nText\n", 0},
		{"no h1", "## Section\n\nText\n", 0},
		{"two h1s", "# First\n\n# Second\n", 1},
		{"three h1s", "# One\n\n# Two\n\n# Three\n", 2},
		{"h1 with h2", "# Title\n\n## Sub\n", 0},
	}
	r := rules.MD025{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
		})
	}
}

// ── MD040 ─────────────────────────────────────────────────────────────────────

func TestMD040(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"fenced with language", "```go\nfmt.Println()\n```\n", 0},
		{"fenced without language", "```\nsome code\n```\n", 1},
		{"two blocks one missing language", "```go\ncode\n```\n\n```\nother\n```\n", 1},
		{"no fenced blocks", "# Title\n\nParagraph\n", 0},
	}
	r := rules.MD040{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
		})
	}
}

// ── MD041 ─────────────────────────────────────────────────────────────────────

func TestMD041(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"starts with h1", "# Title\n\nText\n", 0},
		{"starts with paragraph", "Some intro\n\n# Title\n", 1},
		{"starts with h2", "## Section\n\nText\n", 1},
		{"empty document", "", 0},
		{"starts with fenced code", "```go\ncode\n```\n", 1},
	}
	r := rules.MD041{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
		})
	}
}

// ── MD047 ─────────────────────────────────────────────────────────────────────

func TestMD047(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
	}{
		{"ends with newline", "# Title\n", 0},
		{"no trailing newline", "# Title", 1},
		{"empty file", "", 0},
		{"multiple newlines ok", "# Title\n\n", 0},
		{"windows crlf newline", "# Title\r\n", 0},
	}
	r := rules.MD047{}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := r.Check(buildCtx(tt.input))
			assert.Len(t, results, tt.wantLen)
		})
	}
}

// ── Registry ──────────────────────────────────────────────────────────────────

func TestDefault_returnsAllRules(t *testing.T) {
	rs := rules.Default()
	assert.Len(t, rs, 8)
	ids := make(map[string]bool)
	for _, r := range rs {
		ids[r.ID()] = true
		assert.NotEmpty(t, r.Description())
	}
	for _, expected := range []string{"MD001", "MD009", "MD010", "MD022", "MD025", "MD040", "MD041", "MD047"} {
		assert.True(t, ids[expected], "missing rule %s", expected)
	}
}
