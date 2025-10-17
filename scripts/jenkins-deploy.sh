#!/bin/bash
# Jenkins deployment script for baskit-distributor-hub

# Install dependencies
npm install vite --save-dev

# Clean previous build
rm -rf dist

# Build the application using the Jenkins-specific script
pnpm run build:jenkins

# Log success message
echo "Build completed successfully!"