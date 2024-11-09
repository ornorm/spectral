#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Clean the dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir dist

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test -- --passWithNoTests

# Build the project
echo "Building the project..."
npm run build

# Generate documentation
echo "Generating documentation..."
npm run docs

# Bump the version
echo "Bumping version..."
npm version patch -m "Bump version to %s"

# Run semantic release
echo "Running semantic release..."
./bin/release/semantic-release.sh

echo "Release process completed successfully."
