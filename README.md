# opencode-glm-quota

[![npm version](https://img.shields.io/npm/v/opencode-glm-quota.svg)](https://www.npmjs.com/package/opencode-glm-quota)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/guyinwonder168/opencode-glm-quota/workflows/CI/badge.svg)](https://github.com/guyinwonder168/opencode-glm-quota/actions)
[![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-light.svg)](https://sonarcloud.io/summary/new_code?id=guyinwonder168_opencode-glm-quota)
---
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=guyinwonder168_opencode-glm-quota&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=guyinwonder168_opencode-glm-quota)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=guyinwonder168_opencode-glm-quota&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=guyinwonder168_opencode-glm-quota)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=guyinwonder168_opencode-glm-quota&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=guyinwonder168_opencode-glm-quota)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=guyinwonder168_opencode-glm-quota&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=guyinwonder168_opencode-glm-quota)

OpenCode plugin to query Z.ai GLM Coding Plan usage statistics with real-time quota monitoring, model usage tracking, and MCP tool usage.

## Features

- 📊 Query current quota limits (5-hour token cycle, weekly quota, monthly MCP usage)
- 🤖 View model usage statistics (24-hour rolling window)
- 🔧 View MCP tool usage (web_search, web_reader, etc.)
- 🌍 Supports both Global (api.z.ai) and CN (open.bigmodel.cn) platforms
- 🔐 Automatic credential discovery via OpenCode authentication context
- 📈 Visual progress bars for quota percentages rendered in Markdown code spans
- ⏰ Reset countdown display - Shows when quota resets with local timezone clock time (hours/days + HH:MM)
- 🏷️ Account plan display - Shows your subscription tier (Lite, Pro, etc.)
- ⚡ Fail-fast error handling (no retry logic - user controls when to retry)

## Installation

### Option 1: npm (Recommended)

```bash
# Install plugin
npm install opencode-glm-quota

# Run installer to configure OpenCode
npx opencode-glm-quota install
```

**What the installer does:**
- Copies `/glm_quota` command to `~/.config/opencode/command/glm_quota.md`
- Copies skill documentation to `~/.config/opencode/skills/glm-quota/SKILL.md`
- Automatically adds plugin to your OpenCode config
- Copies agent to `~/.config/opencode/agents/`
- Supports `--force` flag to overwrite existing files

### Uninstall

```bash
# Remove OpenCode integration files and config
npx opencode-glm-quota uninstall

# If installed globally
npx opencode-glm-quota uninstall --global
```

**What the uninstaller does:**
- Removes `/glm_quota` command
- Deletes `skills/glm-quota/SKILL.md`
- Removes plugin entry from OpenCode config
- Removes agent file and legacy config
- Runs `npm remove opencode-glm-quota` (or `--global`)

### Option 2: From GitHub

```bash
npm install github:guyinwonder168/opencode-glm-quota
```

### Option 3: Local Development

```bash
# Clone and build
git clone https://github.com/guyinwonder168/opencode-glm-quota.git
cd opencode-glm-quota
npm install
npm run build

# Link for local testing
npm link

# Run the installer for local testing
node bin/install.js
```

## Quick Start

Once installed, simply run the plugin command in OpenCode:

```bash
/glm_quota
```

The plugin will automatically detect your credentials (from OpenCode authentication) and display your usage statistics.

## Usage

### Authentication Setup

This plugin uses OpenCode's built-in authentication system. No manual configuration required.

**Primary Method (Recommended):**

```bash
# In OpenCode TUI
/connect
# Select: Z.AI Coding Plan or Z.AI
# Enter your API key
```

**Fallback (Development/Testing Only):**

```bash
# For Global platform (api.z.ai)
export ZAI_API_KEY="your-api-key"

# For CN platform (open.bigmodel.cn)
export ZHIPU_API_KEY="your-api-key"
```

### Running the Plugin

After authentication, simply run:

```bash
/glm_quota
```

### Output Example

```markdown
### 📊 Z.ai GLM Coding Plan — Pro

- **Platform**: Z.AI
- **Period**: 2026-01-17 21:00:00 → 2026-01-18 20:59:59

##### 🪙 Quota Limits

| Window | Usage | Progress | Resets In |
|--------|------:|----------|-----------|
| ⏱️ 5h Token | 40.5% | `█████░░░░░░░` | 3h 42m (01:34) |
| 📅 Weekly | 52.0% | `██████░░░░░░` | 4d 12h (Sat 13:48) |
| 🔌 MCP (1 Month) | 12.3% | `█░░░░░░░░░░░` | — |

##### 📊 Quota Usage

| Metric | Value |
|--------|------:|
| 💰 **Token Used** | **12,500,000 / 40,000,000** |
| 🔌 **MCP Used** | **123 / 1000** |

##### 🔧 MCP Tool Breakdown

| Tool | Count |
|------|------:|
| 🔍 Network Searches | 5,678 |
| 🌐 Web Reads | 2,345 |
| 📖 ZRead Calls | 890 |

##### 🤖 Model Usage (24h)

| Metric | Value |
|--------|------:|
| 🔢 Total Tokens | 12,500,000 (31% of 5h limit) |
| ⏱️ 5h Window | 40.5% of 40,000,000 |
| 📞 Total Calls | 1,234 |

##### 🛠️ Tool Usage (24h)

| Tool | Count |
|------|------:|
| 🔍 Network Searches | 5,678 |
| 🌐 Web Reads | 2,345 |
| 🎭 ZRead Calls | 890 |
```

### Error Handling

The plugin uses fail-fast error handling. If any API request fails, it will display the error and stop (no automatic retries). This gives you full control over when to retry.

**Example Error Output:**

```markdown
### ⚠️ Credentials Not Found

Please authenticate first.

**How to fix:**
1. Run `/connect` command in OpenCode TUI.
2. Select "Z.AI Coding Plan", "Z.AI", or "Zhipu".
3. For development/testing, set `ZAI_API_KEY` or `ZHIPU_API_KEY`.
```

## API Reference

This plugin queries three Z.ai monitoring endpoints:

| Endpoint | Purpose | Query Params |
|----------|---------|--------------|
| `/api/monitor/usage/quota/limit` | Current quota percentages | None |
| `/api/monitor/usage/model-usage` | Model usage (24h window) | `startTime`, `endTime` |
| `/api/monitor/usage/tool-usage` | MCP tool usage (24h window) | `startTime`, `endTime` |

### Platform Detection

The plugin automatically detects the platform based on the provider ID used during authentication:

| Provider ID | Platform | API Base URL |
|-------------|----------|---------------|
| `zai-coding-plan` | ZAI | `https://api.z.ai` |
| `zai` | ZAI | `https://api.z.ai` |
| `zhipu` | ZHIPU | `https://open.bigmodel.cn` |

### Credential Priority

The plugin discovers credentials in this order:

1. **OpenCode authentication context** (managed by OpenCode) - PRIMARY
2. **Environment variable** `ZAI_API_KEY` (Global) or `ZHIPU_API_KEY` (CN) - FALLBACK (dev/testing only)

**Where credentials are read:** OpenCode stores `auth.json` at `~/.local/share/opencode/auth.json` on **all platforms, including Windows**. On Windows the plugin additionally checks the legacy `%LOCALAPPDATA%\opencode\auth.json` location as a fallback, trying the XDG path first so a stale legacy or workaround copy can never override current credentials. Every candidate is probed until one yields a valid key.

### Time Window

Usage statistics are queried for a 24-hour rolling window:
- **Start**: Yesterday at current hour (e.g., 14:00:00)
- **End**: Today at current hour end (e.g., 14:59:59)

### Authentication

**Critical**: The plugin does NOT use "Bearer" prefix in the Authorization header. The token is passed directly:

```http
Authorization: {token}
Accept-Language: en-US,en
Content-Type: application/json
```

## Development

### Build Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Clean build artifacts
npm run clean

# Run all tests
npm run test

# Run test suite with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.test.ts

# Watch mode during development
npm run test -- --watch

# Lint source code
npm run lint

# Prepare for npm publish
npm run prepublishOnly
```

### Project Structure

```
src/
  index.ts              # Main plugin entry point
  api/
    client.ts           # HTTPS client with timeout and error handling
    endpoints.ts        # Platform-specific API endpoints
    platforms.ts        # Platform detection and naming
  utils/
    date-formatter.ts   # Date/time formatting utilities
    progress-bar.ts     # ASCII progress bar rendering
    time-window.ts      # Rolling window calculation
integration/
  agents/glm-quota-exec.md      # Minimal executor agent (Markdown)
  command/glm_quota.md          # /glm_quota slash command
  skills/glm-quota/SKILL.md      # Skill documentation
bin/
  install.js                     # Installation script
dist/                   # Compiled JavaScript (generated)
tests/                  # Test suite
package.json            # Dependencies and scripts
tsconfig.json           # TypeScript configuration
```

### Code Style Guidelines

- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Always use type annotations for function returns
- Use `as const` for immutable constants

For detailed coding conventions, see [AGENTS.md](AGENTS.md).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © 2026

## Acknowledgments

- **Adaptation from [zai-org/zai-coding-plugins](https://github.com/zai-org/zai-coding-plugins)** - This plugin is an OpenCode adaptation of the original Z.ai coding plugins repository
- Built for [OpenCode](https://opencode.ai)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed changes.
