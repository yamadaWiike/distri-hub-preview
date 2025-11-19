#!/bin/bash
# Setup npm to use local directory for global installs
# This avoids permission issues in CI/CD environments

# Create local npm directory
mkdir -p ~/.npm-global

# Configure npm to use local directory
npm config set prefix '~/.npm-global'

# Add to PATH for current session
export PATH=~/.npm-global/bin:$PATH

echo "npm configured to use local global directory"
echo "npm prefix: $(npm config get prefix)"
