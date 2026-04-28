// Package config handles loading and discovery of .crackdown.yaml config files.
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const defaultFilename = ".crackdown.yaml"

// RuleConfig holds per-rule overrides.
type RuleConfig struct {
	// Severity overrides the default rule severity ("error", "warning", "info").
	Severity string `yaml:"severity"`
	// Enabled controls whether the rule runs. Defaults to true when omitted.
	Enabled *bool `yaml:"enabled"`
}

// IsEnabled reports whether the rule should run (true unless explicitly disabled).
func (rc RuleConfig) IsEnabled() bool {
	return rc.Enabled == nil || *rc.Enabled
}

// Config is the top-level configuration structure for a .crackdown.yaml file.
type Config struct {
	Rules map[string]RuleConfig `yaml:"rules"`
}

// Load loads configuration from the given path, or auto-discovers
// .crackdown.yaml by walking up from the current working directory when
// path is empty. Returns an empty Config (not an error) when no file is found.
func Load(path string) (*Config, error) {
	if path != "" {
		return loadFile(path)
	}
	return discover()
}

// discover walks up from cwd looking for a .crackdown.yaml file.
func discover() (*Config, error) {
	dir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("getting working directory: %w", err)
	}
	for {
		candidate := filepath.Join(dir, defaultFilename)
		if _, statErr := os.Stat(candidate); statErr == nil {
			return loadFile(candidate)
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break // reached filesystem root
		}
		dir = parent
	}
	return &Config{}, nil
}

// loadFile reads and parses a YAML config file.
func loadFile(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", path, err)
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", path, err)
	}
	return &cfg, nil
}
