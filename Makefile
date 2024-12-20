VERSION := $(shell echo "1.0.0")  # 고정값 사용으로 디버깅
release:
	@echo "Starting release process..."
	@if [ "$$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then \
		echo "Error: Must be on main branch"; \
		exit 1; \
	fi
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Error: Working directory not clean"; \
		exit 1; \
	fi
	@echo "Release process test completed!"
