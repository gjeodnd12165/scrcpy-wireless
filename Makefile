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
	@(trap 'echo "Returning to main branch..." && git switch main' EXIT; \
		echo "Creating release branch..." && \
		git switch -C release main && \
		echo "Pushing to remote..." && \
		git push -f origin release \
	)
	@echo "Release process completed successfully!"

# Show help
help:
	@echo "Available targets:"
	@echo "  release  - Create release branch from main and push to remote"
	@echo "  help     - Show this help message"
