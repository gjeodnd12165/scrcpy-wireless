VERSION := $(shell node -p "require('./package.json').version")

define branch-Checking
	echo "Checking branch and status..."
	if [ "$$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then \
		echo "Error: Must be on main branch"; \
		exit 1; \
	fi; \
	echo "Ensuring working directory is clean..."; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "Error: Working directory not clean"; \
		exit 1; \
	fi
endef

define tag-Check
	echo "Checking if tag $(VERSION) exists..."
	if git ls-remote --tags origin | grep -q "refs/tags/$(VERSION)"; then \
		echo "Error: Tag $(VERSION) already exists on remote. Cannot proceed with release."; \
		exit 1; \
	fi
endef

define tag-ForceDelete
	echo "Force deleting existing tag $(VERSION)..."
	git tag -d "$(VERSION)" || { echo "Error: Failed to delete local tag $(VERSION)"; exit 1; }; \
	git push origin :refs/tags/$(VERSION) || { echo "Error: Failed to delete remote tag $(VERSION)"; exit 1; }
endef

define do_release
	echo "Creating release branch..."; \
	git switch -C release main || exit 1; \
	echo "Creating tag: $(VERSION)"; \
	git tag "$(VERSION)" || exit 1; \
	echo "Pushing to remote..."; \
	git push origin release --tags || exit 1
endef

release:
	@echo "Starting release process..."

	@$(call branch-Checking)

	@$(call tag-Check)
	( \
		trap 'echo "Returning to main branch..."; git switch main' EXIT; \
		$(call do_release); \
	)
	@echo "Release process completed successfully!"

release-force:
	@echo "Starting FORCE release process..."

	@$(call branch-Checking)

	@$(call tag-ForceDelete)
	( \
		trap 'echo "Returning to main branch..."; git switch main' EXIT; \
		$(call do_release); \
	)
	@echo "Force release process completed successfully!"
