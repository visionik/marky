package rules

import "github.com/visionik/crackdown/go/pkg/lint"

// Default returns the full set of built-in rules in their recommended order.
func Default() []lint.Rule {
	return []lint.Rule{
		MD001{},
		MD009{},
		MD010{},
		MD022{},
		MD025{},
		MD040{},
		MD041{},
		MD047{},
	}
}
