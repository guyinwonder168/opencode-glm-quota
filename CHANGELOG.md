# Changelog

All notable changes to GLM Status Plugin project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.3.0] - 2026-01-22

### Added
- **Global Installation & Setup Command** - Automatic OpenCode configuration:
  - `integration/` directory structure with command/, skill/, and opencode.jsonc
  - `bin/install.js` installer script that copies files to `~/.config/opencode/`
  - `npx @opencode-glm-quota/plugin install` command for easy setup
  - Config merging: preserves existing user configuration while adding glm-quota-exec agent
  - `--force` flag support for overwriting existing files
  - jsonc-parser dependency for parsing JSON with comments

### Changed
- Moved integration files from `.opencode/` to `integration/` directory
- Converted `opencode.json` to `opencode.jsonc` with helpful comments
- Updated package.json with bin entry and integration/ in files array
- Simplified installation: users can now run installer after npm install

### Technical
- New installer: `bin/install.js` (199 lines, pure JavaScript)
- Integration files shipped with npm package:
  - `integration/command/glm_quota.md`
  - `integration/skill/glm-quota-skill.md`
  - `integration/opencode.jsonc` (JSONC format with comments)
- Deep merge utility for safe config merging
- Error handling for permission, parse, and file operation errors

### Files
- `integration/command/glm_quota.md` - Command definition (moved from .opencode/)
- `integration/skill/glm-quota-skill.md` - Skill documentation (moved from .opencode/)
- `integration/opencode.jsonc` - Agent configuration with comments (NEW, JSONC format)
- `bin/install.js` - Installation script (NEW)
- `package.json` - Updated with bin entry and jsonc-parser dependency

### Documentation
- README.md updated with installer usage instructions
- CHANGELOG.md updated with version history

### Quality
- ✅ Installer tested successfully
- ✅ Files copied to ~/.config/opencode/ correctly
- ✅ Config merging preserves existing settings
- ✅ All files shipped with npm package

---

## [1.2.0] - 2026-01-21

### Added
- **Next Reset Time Countdown** - Dynamic reset timing display for quota management:
  - `formatTimeUntilReset()` utility function for human-readable countdowns
  - Enhanced `QuotaLimitItem` interface with `nextResetTime?: number` field
  - Displays "Resets in X hours Y minutes" under quota limits when available
  - Graceful fallback for missing or past reset timestamps
  - Edge case handling: null, undefined, past timestamps, invalid values

### Changed
- Updated `processQuotaLimit()` to preserve `nextResetTime` from TOKENS_LIMIT API responses
- Enhanced `formatOutput()` to display reset countdown under quota limits section
- Improved user experience with dynamic timing information instead of static percentages

### Technical
- New utility module: `src/utils/reset-timer.ts` (46 lines)
- Comprehensive test coverage: 13 new tests (9 functional + 4 integration)
- Total test count: 50 tests passing (37 existing + 13 new)
- All edge cases tested and passing (100% pass rate)

### Files
- `src/utils/reset-timer.ts` - Reset time formatting utility (NEW)
- `tests/functional/reset-timer.test.ts` - 9 functional tests (NEW)
- `tests/integration/reset-time-display.test.ts` - 4 integration tests (NEW)
- `src/index.ts` - Updated with reset countdown logic

### Quality
- ✅ TypeScript compiles without errors
- ✅ ESLint passes (0 errors, 0 warnings)
- ✅ All 50 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Pure functions, no side effects
- ✅ Type-safe with strict mode
- ✅ SonarCloud quality gate passing

### Fixed
- Removed duplicate `formatHeader()` function (TypeScript compilation error)
- Removed unused constants `LINE_CONTENT` and `LINE_INDENT` from formatHeader
- Added explicit return type to `getTokenLimitInfo()` function
- CI workflow now generates coverage reports (fixes missing artifact warning)

### Git Commits
- `17e300b` - "feat: add next reset time countdown display"
- `95cae50` - "fix: resolve all SonarCloud and linting issues"
- `fdace5a` - "ci: generate coverage reports in CI workflow"
- Branch: `feature/slice-4.5-reset-time` (committed and pushed to remote)

---

## [1.1.0] - 2026-01-18

### Added
- **Complete GLM Quota Plugin** with full functionality:
  - Real-time quota monitoring (5-hour token cycle, monthly MCP usage)
  - Model usage statistics (24-hour rolling window)
  - MCP tool usage tracking (web_search, web_reader, zread)
  - ASCII table output with visual progress bars (╔ ═ ╗ ║ ╠ ╣ ╚)
  - Cross-platform support (Linux, macOS, Windows)

### Changed
- Migrated from standalone script to complete OpenCode plugin architecture
- Full API integration replacing placeholder messages
- Enhanced credential discovery with multi-format support

### Technical
- 462 lines TypeScript (7 modules)
- 3 API endpoints: quota limits, model usage, tool usage
- 2 platforms: Z.AI (global), ZHIPU (China)
- Native HTTPS client with timeout and error handling

### Files
- `src/api/client.ts`, `endpoints.ts`, `platforms.ts`
- `src/utils/date-formatter.ts`, `progress-bar.ts`, `time-window.ts`
- `.opencode/command/glm_quota.md`, `opencode.json`, `plugin/`, `skill/`

---

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