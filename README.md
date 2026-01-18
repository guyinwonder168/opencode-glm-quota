# opencode-glm-quota

[![npm version](https://img.shields.io/npm/v/opencode-glm-quota.svg)](https://www.npmjs.com/package/opencode-glm-quota)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/guyinwonder168/opencode-glm-quota/ci.yml/badge.svg)](https://github.com/guyinwonder168/opencode-glm-quota/actions)

OpenCode plugin to query Z.ai GLM Coding Plan usage statistics with real-time quota monitoring, model usage tracking, and MCP tool usage.

## Features

- 📊 Query current quota limits (5-hour token cycle, monthly MCP usage)
- 🤖 View model usage statistics (24-hour rolling window)
- 🔧 View MCP tool usage (web_search, web_reader, etc.)
- 🌍 Supports both Global (api.z.ai) and CN (open.bigmodel.cn) platforms
- 🔐 Automatic credential discovery from OpenCode auth.json
- 📈 Visual progress bars for quota percentages
- ⚡ Fail-fast error handling (no retry logic - user controls when to retry)

## Installation

### Option 1: npm (Recommended)

```bash
npm install opencode-glm-quota
```

Then add to your OpenCode config (`~/.config/opencode/config.json`):

```json
{
  "plugins": ["opencode-glm-quota"]
}
```

### Option 2: From GitHub

```bash
npm install github:guyinwonder168/opencode-glm-quota
```

### Option 3: Manual Installation

1. Download the latest release from GitHub
2. Copy `dist/index.js` to `~/.config/opencode/plugin/glm-quota.js`

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

```
╔════════════════════════════════════════════════════════════╗
║           Z.ai GLM Coding Plan Usage Statistics            ║
╠════════════════════════════════════════════════════════════╣
║  Platform: ZAI                                             ║
║  Period: 2026-01-12 14:00:00 → 2026-01-13 14:59:59         ║
╠════════════════════════════════════════════════════════════╣
║  📊 QUOTA LIMITS                                           ║
╟────────────────────────────────────────────────────────────╢
║  Token usage(5 Hour)   [████████████░░░░░░░░░░░░░░░░░░]  40.5% ║
║  MCP usage(1 Month)    [████░░░░░░░░░░░░░░░░░░░░░░░░░░]  12.3% ║
║       Used: 123/1000                                       ║
╠════════════════════════════════════════════════════════════╣
║  🤖 MODEL USAGE (24h)                                      ║
╟────────────────────────────────────────────────────────────╢
║  {                                                         ║
║    "requests": 45,                                         ║
║    "tokens": 125000                                        ║
║  }                                                         ║
╠════════════════════════════════════════════════════════════╣
║  🔧 TOOL/MCP USAGE (24h)                                   ║
╟────────────────────────────────────────────────────────────╢
║  {                                                         ║
║    "web_search": 15,                                       ║
║    "web_reader": 8                                         ║
║  }                                                         ║
╚════════════════════════════════════════════════════════════╝
```

### Error Handling

The plugin uses fail-fast error handling. If any API request fails, it will display the error and stop (no automatic retries). This gives you full control over when to retry.

**Example Error Output:**

```
╔════════════════════════════════════════════════════════════╗
║  ❌ Authentication Error                                    ║
╠════════════════════════════════════════════════════════════╣
║  Not authenticated with Z.AI. Please run `/connect`       ║
║  command in OpenCode TUI and select "Z.AI Coding Plan".    ║
╚════════════════════════════════════════════════════════════╝
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

1. **OpenCode auth.json** (`~/.local/share/opencode/auth.json`) - PRIMARY
2. **Environment variable** `ZAI_API_KEY` (Global) or `ZHIPU_API_KEY` (CN) - FALLBACK (dev/testing only)

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
  index.ts           # Main plugin entry point
dist/               # Compiled JavaScript (generated)
package.json         # Dependencies and scripts
tsconfig.json        # TypeScript configuration
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

- API specification verified from [zai-org/zai-coding-plugins](https://github.com/zai-org/zai-coding-plugins)
- Built for [OpenCode](https://opencode.ai)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed changes.
