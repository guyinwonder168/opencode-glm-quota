# Changelog

All notable changes to GLM Status Plugin project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-01-18

### Added
- Complete OpenCode plugin implementation with full GLM quota querying functionality
- **Authentication & Credential Discovery**:
  - OpenCode auth.json file reading (cross-platform: Linux, macOS, Windows)
  - Environment variable fallback (ZAI_API_KEY, ZHIPU_API_KEY, ZHIPUAI_API_KEY)
  - Support for multiple provider IDs (zai-coding-plan, zai, z-ai, z.ai, zhipu, zhipuai)
  - Flexible API key extraction (supports apiKey, api_key, token, key, accessToken, auth_token)

- **Platform Detection**:
  - Z.AI (Global) platform support with api.z.ai endpoints
  - ZHIPU (China) platform support with open.bigmodel.cn / dev.bigmodel.cn endpoints
  - Provider ID to platform mapping with validation

- **API Integration**:
  - Native HTTPS client with timeout handling and connection cleanup
  - Three monitoring endpoints: quota limits, model usage, tool/MCP usage
  - Time window calculation (24-hour rolling window)
  - Query parameter encoding and URL construction
  - Token sanitization in error messages

- **Response Processing**:
  - Quota limit parsing with human-readable type labels
  - Model usage statistics aggregation
  - MCP tool usage breakdown (Network Searches, Web Reads, ZRead calls)
  - Usage percentage calculations

- **Output Formatting**:
  - ASCII table rendering with box-drawing characters (╔, ╠, ║, ╚, ╟, ╢)
  - Progress bar visualization (█ █ ▒ ░)
  - Platform and time period headers
  - Token formatting with thousand separators

- **OpenCode Integration**:
  - `/glm_quota` slash command
  - Minimal executor agent configuration for low context usage
  - Skill documentation for TUI discovery

### Changed
- **Architecture**: Complete rewrite from standalone script to OpenCode plugin architecture
- **Authentication**: Migrated from URL parsing to provider ID-based platform detection
- **Output**: Replaced simple text output with formatted ASCII tables
- **Dependencies**: Reduced to minimal set (@opencode-ai/plugin only)

### Technical Details
- **Lines of Code**: ~462 (TypeScript) + ~500 (tests, configs, docs)
- **Modules**: 7 (index, client, endpoints, platforms, date-formatter, progress-bar, time-window)
- **Test Coverage**: Functional tests for all utility modules, platform detection, credential discovery
- **Platforms**: Z.AI (Global) and ZHIPU (China)
- **API Endpoints**: 3 (quota/limit, model-usage, tool-usage)

### Files Added
```
src/api/client.ts          # HTTPS client with timeout and error handling
src/api/endpoints.ts       # Platform-specific endpoint definitions
src/api/platforms.ts       # Platform detection and naming
src/utils/date-formatter.ts # Date/time formatting utilities
src/utils/progress-bar.ts  # Progress bar rendering
src/utils/time-window.ts   # Rolling window calculation
.opencode/command/glm_quota.md    # Slash command configuration
.opencode/opencode.json           # Agent configuration
.opencode/plugin/glm-quota.ts     # Plugin configuration
.opencode/skill/glm-quota-skill.md # Skill documentation
tests/functional/date-formatter.test.ts
tests/functional/progress-bar.test.ts
tests/functional/time-window.test.ts
tests/module/platform-detection.test.ts
scripts/query-usage.mjs    # Standalone query utility
```

### Removed
- Legacy standalone script architecture
- Duplicate test files (.test.js versions)
- Temporary documentation files (COMPLETE_FIX_GUIDE.md, PLUGIN_TROUBLESHOOTING.md, TESTING_SLICE1.md)
- Old query-usage.mjs in docs/

### Security
- Token masking in error messages
- File permission validation for auth.json (0600 check on Unix)
- Silent credential parsing failures (no sensitive data in logs)

---

## [0.1.0] - 2026-01-17

### Added
- Initial changelog file created to track architectural transformation from standalone Claude Code script to OpenCode plugin architecture
- AGENTS.md updated to reference changelog for developer guidance
- Proper versioned changelog format following Keep a Changelog standard

---

### Changed
- OpenCode plugin architecture documentation updated to reflect correct authentication system (provider ID-based, not URL parsing)
- Environment variables documented as fallback for development/testing only (not primary method)
- Fail-fast philosophy documented (no retry logic, user controls retries)
- Security requirements documented (token masking, file permissions)
- Request timeout and connection cleanup added to PRD and AGENTS.md
- Platform detection changed from URL parsing to provider ID mapping
- Dev platform support (dev.bigmodel.cn) added
- Code style guidelines updated to match OpenCode plugin architecture
- Testing section updated to remove retry logic tests, add security tests
- Documentation updated to reference CHANGELOG.md

### Deprecated
- Old summary document (UPDATE-SUMMARY.md) replaced with proper changelog format
- Manual authentication setup instructions removed (OpenCode handles this automatically)

### Fixed
- Typo in "GLM" corrected to "GLM" throughout documents
- Platform detection inconsistencies resolved (now consistent with provider ID approach)
- Authentication approach aligned with OpenCode's plugin system (no direct auth.json reading)
- Error handling philosophy clarified (fail-fast, no retry logic)
- Environment variable role clarified (fallback for dev/testing only)