package config_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/visionik/crackdown/go/internal/config"
)

func TestLoad_explicitPath(t *testing.T) {
	tmp := t.TempDir()
	f := filepath.Join(tmp, ".crackdown.yaml")
	content := `
rules:
  MD009:
    severity: error
  MD010:
    enabled: false
`
	require.NoError(t, os.WriteFile(f, []byte(content), 0o644))

	cfg, err := config.Load(f)
	require.NoError(t, err)
	require.NotNil(t, cfg)

	md009 := cfg.Rules["MD009"]
	assert.Equal(t, "error", md009.Severity)
	assert.True(t, md009.IsEnabled())

	md010 := cfg.Rules["MD010"]
	assert.False(t, md010.IsEnabled())
}

func TestLoad_fileNotFound(t *testing.T) {
	_, err := config.Load("/nonexistent/path/.crackdown.yaml")
	assert.Error(t, err)
}

func TestLoad_invalidYAML(t *testing.T) {
	tmp := t.TempDir()
	f := filepath.Join(tmp, ".crackdown.yaml")
	// An unclosed flow-mapping causes a genuine parse error in gopkg.in/yaml.v3.
	require.NoError(t, os.WriteFile(f, []byte("rules:\n  MD009: {unclosed"), 0o644))

	_, err := config.Load(f)
	assert.Error(t, err)
}

func TestLoad_noConfigFound(t *testing.T) {
	// Point to a temp dir without a .crackdown.yaml; auto-discovery should
	// succeed and return an empty (default) config.
	tmp := t.TempDir()
	orig, err := os.Getwd()
	require.NoError(t, err)
	require.NoError(t, os.Chdir(tmp))
	defer func() { _ = os.Chdir(orig) }()

	cfg, err := config.Load("")
	require.NoError(t, err)
	assert.NotNil(t, cfg)
	assert.Empty(t, cfg.Rules)
}

func TestRuleConfig_IsEnabled(t *testing.T) {
	trueVal := true
	falseVal := false

	assert.True(t, config.RuleConfig{}.IsEnabled(), "nil Enabled should default to true")
	assert.True(t, config.RuleConfig{Enabled: &trueVal}.IsEnabled())
	assert.False(t, config.RuleConfig{Enabled: &falseVal}.IsEnabled())
}
