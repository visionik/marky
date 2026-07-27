package lint

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/text"
)

// Linter runs a set of Rules against Markdown files.
type Linter struct {
	rules []Rule
}

// New creates a Linter that applies the given rules.
func New(rules ...Rule) *Linter {
	return &Linter{rules: rules}
}

// LintString lints the given Markdown content.
// file is used as the filename in diagnostic output.
func (l *Linter) LintString(file, content string) []Result {
	ctx := buildContext(file, []byte(content))
	var results []Result
	for _, r := range l.rules {
		results = append(results, r.Check(ctx)...)
	}
	return results
}

// LintFile reads the file at path and lints it.
func (l *Linter) LintFile(path string) ([]Result, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return l.LintString(path, string(data)), nil
}

// LintDir recursively lints every .md file under dir, skipping
// .git/, node_modules/, and vendor/ directories.
func (l *Linter) LintDir(dir string) ([]Result, error) {
	var results []Result
	err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			switch d.Name() {
			case ".git", "node_modules", "vendor":
				return filepath.SkipDir
			}
			return nil
		}
		if strings.EqualFold(filepath.Ext(path), ".md") {
			res, lintErr := l.LintFile(path)
			if lintErr != nil {
				return lintErr
			}
			results = append(results, res...)
		}
		return nil
	})
	return results, err
}

// buildContext parses src with goldmark and constructs a Context.
func buildContext(file string, src []byte) *Context {
	md := goldmark.New()
	node := md.Parser().Parse(text.NewReader(src))

	rawLines := bytes.Split(src, []byte("\n"))
	lines := make([]string, len(rawLines))
	for i, l := range rawLines {
		lines[i] = string(bytes.TrimRight(l, "\r"))
	}

	return &Context{
		File:   file,
		Source: src,
		Lines:  lines,
		Node:   node,
	}
}
