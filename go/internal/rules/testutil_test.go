package rules_test

import (
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/text"

	"github.com/visionik/crackdown/go/pkg/lint"
)

// buildCtx creates a lint.Context from a raw markdown string for use in tests.
func buildCtx(content string) *lint.Context {
	src := []byte(content)
	md := goldmark.New()
	node := md.Parser().Parse(text.NewReader(src))
	lines := strings.Split(content, "\n")
	return &lint.Context{
		File:   "test.md",
		Source: src,
		Lines:  lines,
		Node:   node,
	}
}
