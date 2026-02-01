# Changelog

All notable changes to GLM Status Plugin project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.5.0] - 2026-02-02

### Changed
- Refactored output formatting helpers in `src/index.ts` for clearer model/tool usage rendering.
- Consolidated repeated error-detail formatting logic in `src/api/client.ts`.

### Technical
- Centralized quota limit constants to UPPER_SNAKE_CASE defaults.
- Tightened integration test typing by removing `any` usage.
- Added explicit workflow permissions for CI and SonarCloud workflows.

### Added
- **Integration error coverage (catch block)**
  - New integration tests in `tests/integration/plugin-catch-block.test.ts`
  - Verifies boxed error handling for thrown `Error`, string throws, and multiline errors

- **TLS fixtures for HTTPS tests**
  - Added `tests/fixtures/test-key.pem` and `tests/fixtures/test-cert.pem`
  - Enables real HTTPS server testing without EPROTO failures
- **500+ Server Error Handling** - Graceful server error messages:
  - Extended `formatApiError()` to handle HTTP 500, 502, 503, etc. responses
  - User-friendly boxed message: "Server error. Please try again later."
  - Token sanitization applied to prevent credential exposure in error details
  - 60-character boxed error format for consistency
  - 4 new tests for 500+ error handling (all passing)

- **429 Rate Limit Error Handling** - Graceful rate limiting error messages:
  - `formatApiError()` function for HTTP 429 responses
  - User-friendly boxed message: "Too many requests. Please try again later."
  - Token sanitization applied to prevent credential exposure in error details
  - 60-character boxed error format for consistency
  - 4 new tests for 429 error handling (all passing)

- **403 Forbidden Error Handling** - Graceful permission error messages:
  - Extended `formatAuthError()` to handle HTTP 403 responses
  - User-friendly boxed message: "Access denied. You don't have permission."
  - Token sanitization applied to prevent credential exposure in error details
  - 60-character boxed error format for consistency
  - 4 new tests for 403 error handling (all passing)

- **401 Unauthorized Error Handling** - Graceful authentication error messages:
  - `formatAuthError()` function for HTTP 401 responses
  - User-friendly boxed message: "Authentication failed. Please check your credentials."
  - Token sanitization applied to prevent credential exposure in error details
  - 60-character boxed error format for consistency
  - 4 new tests for auth error handling (all passing)

### Fixed
- **HTTPS test server connectivity**
  - `makeRequest()` now honors URL ports (required for local HTTPS test servers)
  - `tests/module/http-client.test.ts` now uses real TLS certs
- **Box dimension constants**: Replaced hardcoded `60` values with `BOX_WIDTH.TOTAL` constant from `src/utils/box-constants.ts` in all test files for consistency

### Technical
- Slice 5 Task 9 complete: 500+ server error handling with TDD methodology
- Slice 5 Task 8 complete: 429 rate limit error handling with TDD methodology
- Slice 5 Task 7 complete: 403 Forbidden error handling with TDD methodology
- Slice 5 Task 6 complete: 401 error handling with TDD methodology
- Test count: 89 tests passing (85 existing + 4 new from Task 9)
- Files modified: `tests/error-handling/api-errors.test.ts`, `tests/error-handling/auth-errors.test.ts`, `src/api/client.ts`, `AGENTS.md`
- Added guideline in AGENTS.md: Always use `BOX_WIDTH` constants instead of hardcoding dimensions
- Commit: `346ade7` - "feat: add 500+ server error handling (slice5-09)"

---

## [1.4.2] - 2026-01-31

### Changed
- **Progress bar rendering**: Switched default bar characters to ASCII (`#` and `-`) to avoid double-width rendering in some terminals (e.g., VTE-based) and keep 60-column box alignment stable

### Technical
- Updated progress bar tests to match ASCII defaults

---

## [1.4.1] - 2026-01-31

### Fixed
- **Box alignment**: Centralized box layout constants to ensure consistent 60-character width across all output lines
  - Added `BOX_WIDTH` constant object with `CONTENT`, `BORDER_CHARS`, and `TOTAL` values
  - Removed duplicate local constants from formatting functions
  - All output lines now exactly 60 characters wide

### Added
- **Alignment validation tests**: 10 comprehensive integration tests to prevent future alignment regressions
  - Validates all lines are exactly 60 characters wide
  - Checks border consistency and section divider alignment
  - Tests Unicode box-drawing characters render correctly
  - Verifies progress bar characters don't break alignment

### Technical
- Improved code maintainability by centralizing layout values
- Enhanced test coverage from 50 to 60 tests (total)

---

## [1.4.0] - 2026-01-31

### Changed
- **Agent configuration format**: Migrated from JSON merge to Markdown file approach
  - Agent now defined in `integration/agents/glm-quota-exec.md` with YAML frontmatter
  - Installer copies MD file to `~/.config/opencode/agents/` (plural directory)
  - Removed `integration/opencode.jsonc` (no longer needed)
  - Cleaner separation of concerns: agent definition separate from plugin config

### Added
- **Markdown agent file**: `integration/agents/glm-quota-exec.md` with YAML frontmatter
  - `description`: Human-readable agent purpose
  - `mode: subagent`: Agent type
  - `hidden: true`: Hide from user-facing lists
  - `permission.edit: deny`, `permission.bash: deny`: Security constraints
  - System prompt in body section (not in frontmatter)

### Fixed
- **Migration path**: Installer now removes old JSON agent config from user's opencode.json
- **Directory naming**: Uses `agents/` (plural) per OpenCode official documentation
- **Uninstaller**: Cleans up both MD file and legacy JSON agent config

### Removed
- `integration/opencode.jsonc` - Agent moved to Markdown format
- JSON-based agent merging logic from installer

### Technical
- Installer updated to handle Markdown agent files
- Uninstaller updated to remove both MD and legacy JSON configs
- Documentation updated to reflect new approach (README.md, AGENTS.md)

---

## [1.3.4] - 2026-01-26

### Fixed
- **Progress bar width**: Reduced from 24 to 11 to create visible gap before right border
- **2-space gap preservation**: Kept `formatProgressBoxLine()` to ensure consistent spacing before border
- **ASCII bar rendering**: Confirmed ASCII bars (`█`, `░`) for terminal compatibility
- **Box border alignment**: Display-width aware padding for emoji and wide characters
- **Emoji header compatibility**: Removed emoji headers (📊, 🤖, 🔧) replaced with ASCII labels for consistent terminal rendering

---

## [1.3.3] - 2026-01-25

### Added
- **Uninstall command**: `opencode-glm-quota uninstall` removes OpenCode integration files, plugin entry, and agent config
### Fixed
- **Box border alignment**: Display-width aware padding for emoji and wide characters
- **Emoji header compatibility**: Removed emoji headers (📊, 🤖, 🔧) replaced with ASCII labels for consistent terminal rendering
### Changed
- Uninstaller attempts `npm remove opencode-glm-quota` (supports `--global`)

---

## [1.3.2] - 2026-01-25

### Added
- **Uninstall command**: `opencode-glm-quota uninstall` removes OpenCode integration files, plugin entry, and agent config

### Changed
- Uninstaller attempts `npm remove opencode-glm-quota` (supports `--global`)

---

## [1.3.1] - 2026-01-25

### Fixed
- **Installer crash on empty configs**: Initialize agent config before assigning glm-quota-exec to avoid postinstall failures
- **Duplicate merge logic**: Removed redundant merge block that referenced an undefined variable
- **Quota box alignment**: Narrowed progress bars to keep right border aligned in output table

---

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
- New installer: `bin/install.js` (pure JavaScript)
- Integration files shipped with npm package:
  - `integration/command/glm_quota.md`
  - `integration/skills/glm-quota/SKILL.md` (plural directory, uppercase filename per OpenCode spec)
  - `integration/opencode.jsonc` (JSONC format with comments)
- Deep merge utility for safe config merging
- Error handling for permission, parse, and file operation errors
- Skill directory follows OpenCode specification: `skills/<name>/SKILL.md`

### Fixed
- **Installation package name**: Fixed README.md and installer to use `opencode-glm-quota` instead of scoped `@opencode-glm-quota/plugin`
- **Circular dependency**: Removed `opencode-glm-quota` from package.json dependencies (package was depending on itself)
- **Bin command name**: Changed `opencode-glm-quota-install` to `opencode-glm-quota` in package.json
- **Installer entry point**: Removed fragile condition, installer now always runs main() function
- **Empty plugins array**: Fixed installer to only create the array being used (either `plugin` or `plugins`), not both
- **Skill directory structure**: Renamed `integration/skill/` to `integration/skills/` (plural per OpenCode spec)
- **Skill file naming**: Renamed `glm-quota-skill.md` to `skills/glm-quota/SKILL.md` (uppercase per spec)
- **Manual config step**: Removed from README - installer now automatically adds plugin to config
- **Documentation project structure**: Updated README.md to reflect correct directory layout

### Files
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
