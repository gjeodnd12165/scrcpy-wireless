VERSION := $(shell echo "1.0.0")

define branch-Checking
	@echo "Checking branch and status..."
	@if [ "$$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then \
		echo "Error: Must be on main branch"; \
		exit 1; \
	fi; \
	echo "Ensuring working directory is clean..."; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "Error: Working directory not clean"; \
		exit 1; \
	fi
endef

define do_release
	@echo "Creating release branch..."
	@git switch -C release main || exit 1
	@echo "Creating tag: $(VERSION)"
	@git tag "$(VERSION)" || exit 1
	@echo "Pushing to remote..."
	@git push origin release --tags || exit 1
endef

release:
	@echo "Starting release process..."
	@$(call branch-Checking)
	@$(call do_release)
	@echo "Release process completed successfully!"
