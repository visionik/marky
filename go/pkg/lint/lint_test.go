package lint_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/visionik/crackdown/go/pkg/lint"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/text"
)

// stubRule is a Rule that always returns a fixed set of results.
type stubRule struct {
	id      string
	results []lint.Result
}

func (s stubRule) ID() string          { return s.id }
func (s stubRule) Description() string { return "stub" }
func (s stubRule) Check(_ *lint.Context) []lint.Result {
	return s.results
}

func TestLinter_LintString_noViolations(t *testing.T) {
	linter := lint.New()
	results := linter.LintString("file.md", "# Hello\n")
	assert.Empty(t, results)
}

func TestLinter_LintString_withRule(t *testing.T) {
	want := lint.Result{File: "f.md", Line: 1, Col: 1, RuleID: "MD999", Message: "test", Severity: lint.SeverityWarning}
	r := stubRule{id: "MD999", results: []lint.Result{want}}
	linter := lint.New(r)
	got := linter.LintString("f.md", "# hi\n")
	require.Len(t, got, 1)
	assert.Equal(t, want, got[0])
}

func TestLinter_LintFile_notFound(t *testing.T) {
	linter := lint.New()
	_, err := linter.LintFile("/nonexistent/path/file.md")
	assert.Error(t, err)
}

func TestLinter_LintFile_success(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "test.md")
	require.NoError(t, os.WriteFile(path, []byte("# Hello\n"), 0o644))

	linter := lint.New()
	results, err := linter.LintFile(path)
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestLinter_LintDir_success(t *testing.T) {
	tmp := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(tmp, "a.md"), []byte("# A\n"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(tmp, "b.md"), []byte("# B\n"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(tmp, "ignore.txt"), []byte("not md"), 0o644))

	called := 0
	r := stubRule{id: "MD999", results: []lint.Result{{File: "x", Line: 1, Col: 1, RuleID: "MD999", Message: "ok", Severity: lint.SeverityInfo}}}
	_ = r

	linter := lint.New()
	results, err := linter.LintDir(tmp)
	require.NoError(t, err)
	assert.Empty(t, results)
	_ = called
}

func TestLinter_LintDir_skipsGit(t *testing.T) {
	tmp := t.TempDir()
	gitDir := filepath.Join(tmp, ".git")
	require.NoError(t, os.MkdirAll(gitDir, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(gitDir, "COMMIT_EDITMSG.md"), []byte("# should skip"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(tmp, "real.md"), []byte("# Real\n"), 0o644))

	linter := lint.New()
	results, err := linter.LintDir(tmp)
	require.NoError(t, err)
	for _, res := range results {
		assert.NotContains(t, res.File, ".git")
	}
}

func TestContext_LineAt(t *testing.T) {
	src := []byte("line1\nline2\nline3\n")
	ctx := &lint.Context{Source: src}

	assert.Equal(t, 1, ctx.LineAt(0))
	assert.Equal(t, 1, ctx.LineAt(4))  // 'e' in line1
	assert.Equal(t, 2, ctx.LineAt(6))  // 'l' in line2
	assert.Equal(t, 3, ctx.LineAt(12)) // 'l' in line3
}

func TestContext_LineAt_negativeOffset(t *testing.T) {
	ctx := &lint.Context{Source: []byte("hello")}
	assert.Equal(t, 1, ctx.LineAt(-1))
}

func TestContext_NodeLine_noSegments(t *testing.T) {
	// A node without Lines segments returns line 1.
	src := []byte("# Hello\n")
	md := goldmark.New()
	node := md.Parser().Parse(text.NewReader(src))
	ctx := &lint.Context{Source: src}
	// The document root node has no Lines().
	got := ctx.NodeLine(node)
	assert.Equal(t, 1, got)
}

func TestContext_NodeLine_withHeading(t *testing.T) {
	// A heading node should resolve to line 1.
	src := []byte("# Hello\n")
	md := goldmark.New()
	node := md.Parser().Parse(text.NewReader(src))
	ctx := &lint.Context{Source: src, Lines: []string{"# Hello", ""}}
	heading := node.FirstChild()
	require.NotNil(t, heading)
	got := ctx.NodeLine(heading)
	assert.GreaterOrEqual(t, got, 1)
}
