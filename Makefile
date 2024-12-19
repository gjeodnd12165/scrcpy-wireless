.PHONY: release clean

# Default target
all: release

# Create release branch and push to remote
release:
	@echo "Starting release process..."
	@echo "Checking current branch..."
	@if [ "$$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then \
		echo "Error: Must be on main branch"; \
		exit 1; \
	fi
	@echo "Ensuring working directory is clean..."
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Error: Working directory not clean"; \
		exit 1; \
	fi
	@echo "Creating release branch..."
	@git checkout -B release main
	@echo "Building application..."
	@npm run build:linux
	@echo "Adding built files..."
	@git add dist/* -f
	@git commit -m "Release: Add built files"
	@echo "Pushing to remote..."
	@git push -f origin release
	@echo "Switching back to main branch..."
	@git checkout main
	@echo "Release process completed successfully!"

# Clean up build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf out/
	@echo "Clean completed!"

# Show help
help:
	@echo "Available targets:"
	@echo "  release  - Create release branch with built files and push to remote"
	@echo "  clean    - Remove build artifacts"
	@echo "  help     - Show this help message"
