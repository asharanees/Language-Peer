#!/bin/bash

# Generate architecture diagram PNG from Mermaid source
# Requires: npm install -g @mermaid-js/mermaid-cli

echo "Generating architecture diagram..."

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "Installing Mermaid CLI..."
    npm install -g @mermaid-js/mermaid-cli
fi

# Generate PNG from Mermaid markdown
mmdc -i docs/architecture-diagram.md -o docs/architecture-diagram.png -t dark -b transparent

echo "Architecture diagram generated at docs/architecture-diagram.png"