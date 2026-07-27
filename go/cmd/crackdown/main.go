// Command crackdown is a fast, extensible Markdown linter.
package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/visionik/crackdown/go/internal/config"
	"github.com/visionik/crackdown/go/internal/reporters"
	"github.com/visionik/crackdown/go/internal/rules"
	"github.com/visionik/crackdown/go/pkg/lint"
)

// version is set at build time via -ldflags "-X main.version=x.y.z".
var version = "dev"

// errLintFailed is a sentinel returned when violations are found so that
// main can exit with code 1 without cobra printing a spurious error message.
var errLintFailed = errors.New("lint failed")

func main() {
	root := newRootCmd()
	root.SilenceErrors = true
	root.SilenceUsage = true

	if err := root.Execute(); err != nil {
		if !errors.Is(err, errLintFailed) {
			fmt.Fprintln(os.Stderr, "error:", err)
		}
		os.Exit(1)
	}
}

func newRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "crackdown",
		Short: "A fast, extensible Markdown linter",
	}
	root.AddCommand(newVersionCmd())
	root.AddCommand(newLintCmd())
	return root
}

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the crackdown version",
		Run: func(_ *cobra.Command, _ []string) {
			fmt.Printf("crackdown %s\n", version)
		},
	}
}

func newLintCmd() *cobra.Command {
	var (
		format     string
		configPath string
	)

	cmd := &cobra.Command{
		Use:   "lint [files/dirs...]",
		Short: "Lint Markdown files",
		Long: `Lint one or more Markdown files or directories.
If no arguments are given, the current directory is linted recursively.`,
		Args: cobra.ArbitraryArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			// Load config (explicit path or auto-discover).
			cfg, err := config.Load(configPath)
			if err != nil {
				return fmt.Errorf("loading config: %w", err)
			}

			// Build the rule set, respecting enabled/disabled from config.
			rs := applyConfig(rules.Default(), cfg)
			linter := lint.New(rs...)

			// Default to current directory when no paths supplied.
			if len(args) == 0 {
				args = []string{"."}
			}

			var allResults []lint.Result
			for _, arg := range args {
				info, statErr := os.Stat(arg)
				if statErr != nil {
					return statErr
				}
				var res []lint.Result
				var lintErr error
				if info.IsDir() {
					res, lintErr = linter.LintDir(arg)
				} else {
					res, lintErr = linter.LintFile(arg)
				}
				if lintErr != nil {
					return lintErr
				}
				allResults = append(allResults, res...)
			}

			// Write output.
			rep, err := reporters.New(format, cmd.OutOrStdout())
			if err != nil {
				return err
			}
			if err := rep.Report(allResults); err != nil {
				return err
			}

			if len(allResults) > 0 {
				return errLintFailed
			}
			return nil
		},
	}

	cmd.Flags().StringVar(&format, "format", "pretty", "Output format: pretty, json, sarif")
	cmd.Flags().StringVar(&configPath, "config", "", "Path to config file (default: auto-discover .crackdown.yaml)")
	return cmd
}

// applyConfig filters the rule set, removing rules disabled in cfg.
func applyConfig(rs []lint.Rule, cfg *config.Config) []lint.Rule {
	if cfg == nil || len(cfg.Rules) == 0 {
		return rs
	}
	filtered := make([]lint.Rule, 0, len(rs))
	for _, r := range rs {
		rc, ok := cfg.Rules[r.ID()]
		if ok && !rc.IsEnabled() {
			continue
		}
		filtered = append(filtered, r)
	}
	return filtered
}
