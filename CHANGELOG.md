# Changelog

All notable changes to GLM Status Plugin project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

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