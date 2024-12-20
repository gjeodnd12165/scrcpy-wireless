VERSION := $(shell node -p "require('./package.json').version" 2>/dev/null || echo "")
ifeq ($(VERSION),)
$(error "Error: Unable to determine version. Ensure package.json exists and is valid.")
endif

define branch-Checking
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
endef

define do_release
	@echo "Creating release branch..."
	@git switch -C release main || git checkout -b release main || { echo "Error: Failed to create or switch to release branch."; exit 1; }
	@echo "Creating tag: $(VERSION)"
	@git tag "$(VERSION)" || { echo "Error: Failed to create tag $(VERSION)."; exit 1; }
	@echo "Pushing to remote..."
	@git push origin release || { echo "Error: Failed to push release branch."; exit 1; }
	@git push --tags || { echo "Error: Failed to push tags."; exit 1; }
endef

.PHONY: release release-force clean help

release:
	@echo "Starting release process..."
	@$(call branch-Checking)

	@if ! git ls-remote --tags origin "$(VERSION)" > /dev/null 2>&1; then \
		echo "Error: Unable to check remote tags. Ensure you have network connectivity."; \
		exit 1; \
	fi

	@if git ls-remote --tags origin "$(VERSION)" | grep -q "$(VERSION)"; then \
		echo "Error: Tag $(VERSION) already exists on remote. Cannot create a new release. Use make release:force to overwrite."; \
		exit 1; \
	fi

	@(trap 'echo "Returning to main branch..." && git switch main || echo "Failed to switch back to main"' EXIT; \
		$(call do_release) \
	)
	@echo "Release process completed successfully!"

release-force:
	@echo "Starting FORCE release process..."
	@$(call branch-Checking)

	@if git ls-remote --tags origin "$(VERSION)" | grep -q "$(VERSION)"; then \
		echo "Removing existing tag: $(VERSION)"; \
		git tag -d "$(VERSION)" || { echo "Error: Failed to delete local tag $(VERSION)"; exit 1; }; \
		git push origin :refs/tags/$(VERSION) || { echo "Error: Failed to delete remote tag $(VERSION)"; exit 1; }; \
	else \
		echo "Tag $(VERSION) does not exist. Proceeding with release."; \
	fi

	@(trap 'echo "Returning to main branch..." && git switch main || echo "Failed to switch back to main"' EXIT; \
		$(call do_release) \
	)
	@echo "Force Release process completed successfully!"

help:
	@echo "Available targets:"
	@echo "  release        - Create release branch from main and push to remote (fails if tag exists)."
	@echo "  release:force  - Create release branch from main and push to remote (overwrites existing tag)."
	@echo "  help           - Show this help message."
