# Task Context: Create GitHub Documentation for OpenCode GLM Quota Plugin

Session ID: 1768662317-github-docs
Created: 2026-01-17
Status: in_progress

## Current Request
Create proper documentation files for an open-source GitHub repository for the opencode-glm-quota plugin. The plugin is ready to be pushed to GitHub as an open-source project.

## Requirements
- Create all necessary GitHub documentation files for an open-source TypeScript/Node.js project
- Follow documentation standards from .opencode/context/core/standards/docs.md
- Ensure documentation is professional, comprehensive, and GitHub-ready
- Include all standard open-source project documentation

## Decisions Made
- This is an OpenCode plugin (not standalone CLI)
- Project name: opencode-glm-quota
- Plugin queries Z.ai GLM Coding Plan usage statistics
- License: MIT (standard for open-source Node.js projects)
- Architecture: OpenCode Plugin with automatic authentication via provider IDs

## Files to Create
1. **README.md** - Main project documentation (project overview, features, installation, usage, contributing)
2. **LICENSE** - MIT License file
3. **CONTRIBUTING.md** - Guidelines for contributors
4. **.github/ISSUE_TEMPLATE/bug_report.md** - Bug report template
5. **.github/ISSUE_TEMPLATE/feature_request.md** - Feature request template
6. **.github/PULL_REQUEST_TEMPLATE.md** - PR template
7. **.gitignore** - Git ignore file for TypeScript/Node.js projects

## Static Context Available
- .opencode/context/core/standards/docs.md (documentation standards)
- AGENTS.md (project-specific coding conventions and architecture)
- CHANGELOG.md (change history and architectural decisions)
- docs/opencode-glm-quota-prd-final.md (product requirements document)
- docs/query-usage.mjs (reference implementation - single source of truth)

## Key Project Information

**Project Description:**
OpenCode plugin for querying Z.ai GLM Coding Plan usage statistics. Provides real-time quota monitoring, model usage statistics, and MCP tool usage tracking for Z.AI and ZHIPU platforms.

**Architecture:**
- OpenCode Plugin (not standalone CLI)
- Authentication via OpenCode's provider ID system (no manual auth.json reading)
- Support for ZAI (global) and ZHIPU (China) platforms
- Fail-fast error handling (no retry logic)
- Sequential API requests (not parallel)

**Key Features:**
- Real-time quota limit monitoring
- Model usage statistics with 24-hour rolling window
- MCP tool usage tracking
- ASCII-formatted output with progress bars
- Platform auto-detection via provider ID
- Development environment support (dev.bigmodel.cn)

**Technology Stack:**
- TypeScript (target ES2022)
- Node.js native https module
- Node.js built-in test runner
- OpenCode plugin SDK

**API Endpoints (verified from query-usage.mjs):**
- `/api/monitor/usage/quota/limit` - Current quotas
- `/api/monitor/usage/model-usage` - Model stats
- `/api/monitor/usage/tool-usage` - MCP tool usage

**Provider IDs:**
- `zai-coding-plan` - GLM Coding Plan (ZAI)
- `zai` - Standard Z.AI platform
- `zhipu` - ZHIPU platform (China)

**Critical Requirements:**
- No "Bearer" prefix in Authorization header
- URL-encode query parameters
- Sequential requests (fail-fast philosophy)
- No retry logic
- Token masking in error messages
- File permission validation (0600 on Unix)

## Constraints/Notes
- Follow the README structure from docs standards (lines 28-59)
- Use MIT License (standard for open-source)
- Include installation instructions via npm
- Include usage examples with `/glm_quota` command
- Link to CONTRIBUTING.md from README
- Reference CHANGELOG.md for detailed change history
- Ensure all documentation follows the "Show, don't tell" principle
- Include error handling examples in documentation
- Document the difference between this plugin and standalone scripts

## Progress
- [ ] Create README.md
- [ ] Create LICENSE (MIT)
- [ ] Create CONTRIBUTING.md
- [ ] Create .github/ISSUE_TEMPLATE/bug_report.md
- [ ] Create .github/ISSUE_TEMPLATE/feature_request.md
- [ ] Create .github/PULL_REQUEST_TEMPLATE.md
- [ ] Create .gitignore
- [ ] Verify all files are GitHub-ready

---
**Instructions for Subagent:**
1. Load the documentation standards from .opencode/context/core/standards/docs.md
2. Read AGENTS.md to understand project architecture and conventions
3. Read CHANGELOG.md to understand architectural decisions
4. Create all listed files following the standards and project context
5. Ensure README.md follows the standard structure (lines 28-59 in docs.md)
6. Include proper badges, features, installation, usage, API reference, and contributing sections
7. Create professional GitHub issue and PR templates
8. Create a proper .gitignore for TypeScript/Node.js projects
9. Use MIT License format
10. After creating all files, verify they are ready for GitHub

**Deliverables:**
All files listed in "Files to Create" section, properly formatted and ready for GitHub.
