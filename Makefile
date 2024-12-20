VERSION := $(shell node -p "require('./package.json').version")

define do_release
	@echo "Creating release branch..."
	@git switch -C release main || exit 1 # 브랜치 생성 실패 시 종료
	@echo "Creating tag: $(VERSION)"
	@git tag "$(VERSION)" || exit 1 # 태그 생성 실패 시 종료
	@echo "Pushing to remote..."
	@git push origin release --tags || exit 1 # 푸시 실패 시 종료
endef

.PHONY: release release-force clean help

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

	@if git tag -l "$(VERSION)" > /dev/null; then \
		echo "Error: Tag $(VERSION) already exists. Cannot create a new release. Use make release:force to overwrite."; \
		exit 1; \
	fi

	@(trap 'echo "Returning to main branch..." && git switch main' EXIT; \
		$(call do_release) \
	)
	@echo "Release process completed successfully!"

release-force:
	@echo "Starting FORCE release process..."
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

	@if git tag -l "$(VERSION)" > /dev/null; then \
		echo "Removing existing tag: $(VERSION)"; \
		git tag -d "$(VERSION)"; \
		git push origin :refs/tags/$(VERSION); \
	fi

	@(trap 'echo "Returning to main branch..." && git switch main' EXIT; \
		$(call do_release,true) \
	)
	@echo "Force Release process completed successfully!"

help:
	@echo "Available targets:"
	@echo "	release			 - Create release branch from main and push to remote (fails if tag exists)."
	@echo "	release:force - Create release branch from main and push to remote (overwrites existing tag)."
	@echo "	help					- Show this help message"