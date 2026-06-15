# OpenCode GLM Quota Plugin - Product Requirements Document

**Version:** 9.0 (Markdown Output Migration - v1.7.0)
**Date:** March 30, 2026
**Status:** Markdown output design complete, implementation planned
**Classification:** Technical Specification - Verified from Official Source

**Package Name:** `opencode-glm-quota`  
**Repository:** `github.com/YOUR_USERNAME/opencode-glm-quota`  
**License:** MIT

---
This PRD specifies an OpenCode plugin that queries Z.ai GLM Coding Plan usage statistics. Version 8.1 is **fully verified** against the official `query-usage.mjs` source code from `zai-org/zai-coding-plugins` repository, **adapted** for OpenCode's plugin architecture, and **prepared for public distribution** via npm and GitHub.

### Key Features

- 📊 Query current quota limits (5-hour token cycle, monthly MCP usage)
- ⏰ **Reset countdown display** - Shows when 5-hour token quota resets (NEW in v1.2.0 ✅)
- 🤖 View model usage statistics (24-hour rolling window)
- 🔧 View MCP tool usage (web_search, web_reader, etc.)
- 🌍 Supports both Global (api.z.ai) and CN (open.bigmodel.cn) platforms
- 📦 Distributed via npm for easy installation
- 📝 **Rich Markdown output** - Rendered by OpenCode's Glamour TUI (NEW in v1.7.0 ⏳)

### Critical Corrections from Previous Versions

| Item | v5.0-v7.0 (Wrong) | v8.x (Verified from Source) |
|------|-------------------|----------------------------|
| **API Endpoints** | ❌ Fabricated `/tools/mcp/usage_query` | ✅ `/api/monitor/usage/model-usage`, `/tool-usage`, `/quota/limit` |
| **Auth Header** | ❌ `Authorization: Bearer {token}` | ✅ `Authorization: {token}` (NO Bearer prefix) |
| **Base URL** | ❌ `api.z.ai/api/coding/paas/v4` | ✅ Base domain + `/api/monitor/usage/*` |
| **Endpoint Count** | ❌ Single endpoint | ✅ Three separate endpoints |
| **Query Params** | ❌ Not specified | ✅ `startTime` and `endTime` (URL encoded) |

---

## 1. Verified API Specification

### 1.1 API Endpoints (VERIFIED ✅)

**Source:** `zai-org/zai-coding-plugins/plugins/glm-plan-usage/skills/usage-query-skill/scripts/query-usage.mjs`

#### Global Platform (api.z.ai)

| Endpoint | Purpose | Query Params |
|----------|---------|--------------|
| `https://api.z.ai/api/monitor/usage/model-usage` | Model usage statistics | `startTime`, `endTime` |
| `https://api.z.ai/api/monitor/usage/tool-usage` | Tool/MCP usage statistics | `startTime`, `endTime` |
| `https://api.z.ai/api/monitor/usage/quota/limit` | Current quota limits & percentages | None |

#### CN Platform (open.bigmodel.cn)

| Endpoint | Purpose | Query Params |
|----------|---------|--------------|
| `https://open.bigmodel.cn/api/monitor/usage/model-usage` | Model usage statistics | `startTime`, `endTime` |
| `https://open.bigmodel.cn/api/monitor/usage/tool-usage` | Tool/MCP usage statistics | `startTime`, `endTime` |
| `https://open.bigmodel.cn/api/monitor/usage/quota/limit` | Current quota limits & percentages | None |

### 1.2 Authentication (VERIFIED ✅)

```http
Authorization: {token}
```

**⚠️ CRITICAL:** Do NOT use "Bearer" prefix. The token is passed directly.

**Required Headers:**
```javascript
{
  'Authorization': authToken,  // Raw token, NO "Bearer" prefix
  'Accept-Language': 'en-US,en',
  'Content-Type': 'application/json'
}
```

### 1.3 Platform Detection (DELETED - Not Applicable for OpenCode)

**REMOVED:** Platform detection via URL parsing is for standalone Claude Code scripts, not OpenCode plugins.

**For OpenCode:** Platform is determined by the provider ID used in authentication, not by parsing API URLs. See Section 2 for the correct credential discovery approach.

### 1.4 Time Window for Usage Queries (VERIFIED ✅)

The official implementation queries usage from **yesterday at current hour** to **today at current hour end** (24-hour rolling window):

```javascript
// From official source (lines 56-67)
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), 0, 0, 0);
const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999);
```

### 1.5 Date Format (VERIFIED ✅)

Format: `yyyy-MM-dd HH:mm:ss` (URL encoded in query params)

```javascript
// From official source (lines 70-78)
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
```

### 1.6 Query Parameters (VERIFIED ✅)

```
?startTime={URL_ENCODED_DATETIME}&endTime={URL_ENCODED_DATETIME}
```

Example:
```
?startTime=2026-01-12%2014%3A00%3A00&endTime=2026-01-13%2014%3A59%3A59
```

**Note:** `/quota/limit` endpoint does NOT use query parameters.

### 1.7 Response Processing (VERIFIED ✅)

From official source (lines 86-107):
```javascript
const processQuotaLimit = (data) => {
  if (!data || !data.limits) return data;
  
  data.limits = data.limits.map(item => {
    if (item.type === 'TOKENS_LIMIT') {
      return {
        type: 'Token usage(5 Hour)',
        percentage: item.percentage
      };
    }
    if (item.type === 'TIME_LIMIT') {
      return {
        type: 'MCP usage(1 Month)',
        percentage: item.percentage,
        currentUsage: item.currentValue,
        total: item.usage,  // Note: original has typo "totol"
        usageDetails: item.usageDetails
      };
    }
    return item;
  });
  return data;
};
```

**Response Types:**
- `TOKENS_LIMIT` → Token/prompt usage for 5-hour cycle
- `TIME_LIMIT` → MCP tools usage for 1-month period

### 1.8 Dev Platform Support (UPDATED)

**CN Platform - Development Environment:**
The plugin also supports Zhipu's development environment endpoint `https://dev.bigmodel.cn/api/monitor/usage/*`.

This is automatically detected when using the `zhipu` provider ID with development credentials.

**Note:** `dev.bigmodel.cn` endpoint follows the same API structure as production `open.bigmodel.cn`.

### 1.9 Next Reset Time Display (ADDED - Slice 4.5 ✅)

**Reset Timing Information:**

The `/quota/limit` API response includes `nextResetTime` field providing Unix timestamp for 5-hour token quota resets.

**Response Field:**
```javascript
{
  "limits": [
    {
      "type": "TOKENS_LIMIT",
      "percentage": 40.5,
      "nextResetTime": 1737468000000  // Unix timestamp in milliseconds
    }
  ]
}
```

**Implementation:**
- Parse `nextResetTime` from TOKENS_LIMIT quota limit items
- Calculate time difference: `nextResetTime - Date.now()`
- Convert milliseconds to hours and minutes
- Display: "Resets in X hours Y minutes"
- Handle edge cases: null/undefined timestamps, past timestamps, invalid values

**Display Integration:**
```
╠════════════════════════════════════════════════════════════╣
║  📊 QUOTA LIMITS                                           ║
╟────────────────────────────────────────────────────────────╢
║  Token usage(5 Hour)   [████████████░░░░░░░░░░░░░░░░░░]  40.5% ║
║  Resets in 4 hours 42 minutes                           ║
║  MCP usage(1 Month)    [████░░░░░░░░░░░░░░░░░░░░░░░░░░]  12.3% ║
```

**User Value:**
- **Before**: Static quota percentages without timing information
- **After**: Dynamic countdown showing exact reset timing
- **Benefit**: Better planning of GLM usage within 5-hour windows

**Status:** ✅ COMPLETED (2026-01-21) - Slice 4.5 implementation complete with 13 new tests

### 1.10 Global Installation & Setup (PLANNED - Slice 4.6 ⏳)

**Problem Statement:**

Adding plugin to `opencode.json` enables npm installation, but does NOT automatically configure OpenCode command/skill/agent files:

```json
// opencode.json
{
  "plugins": ["opencode-glm-quota"]
}
```

This only handles:
- ✅ `npm install opencode-glm-quota` (automatic via OpenCode)
- ✅ Plugin code available in `node_modules/`

But does NOT handle:
- ❌ Agent definition copied to `~/.config/opencode/opencode.json`
- ❌ Command file copied to `~/.config/opencode/command/glm_quota.md`
- ❌ Skill file copied to `~/.config/opencode/skill/glm-quota-skill.md`

**Solution: Installer Command**

Package includes installer command that copies integration files to user's OpenCode config directory.

**Installation Flow:**
```
1. User installs plugin:
   npm install opencode-glm-quota

2. OpenCode loads plugin from node_modules/

3. User runs installer:
   npx opencode-glm-quota install

4. Files copied:
   node_modules/opencode-glm-quota/integration/command/glm_quota.md
      → ~/.config/opencode/command/glm_quota.md

   node_modules/opencode-glm-quota/integration/opencode.jsonc
      → ~/.config/opencode/opencode.json (merged safely)

   node_modules/opencode-glm-quota/integration/skill/glm-quota-skill.md
      → ~/.config/opencode/skill/glm-quota-skill.md

5. User restarts OpenCode, /glm_quota command works ✅
```

**Installer Features:**
- Copies integration files from npm package to OpenCode config directory
- Merges `opencode.jsonc` into existing config using JSONC parser
- `--force` flag overwrites existing files
- `--dry-run` shows what would be copied without making changes
- Graceful handling of existing configurations (safe merge, no clobbering)

**Package Structure:**
```
opencode-glm-quota/
├── package.json (with bin field)
├── dist/
│   └── index.js (compiled plugin)
├── integration/
│   ├── command/
│   │   └── glm_quota.md
│   ├── skill/
│   │   └── glm-quota-skill.md
│   └── opencode.jsonc (JSONC for comments)
└── bin/
    └── install.js (installer executable)
```

**Status:** ⏳ PLANNED - Slice 4.6 (not yet implemented)

### 1.11 Markdown Output Format (PLANNED - v1.7.0 ⏳)

**Problem Statement:**

Current ASCII box output (╔═╗║╚╠╟╢) is not rendered by OpenCode's Glamour TUI renderer. The plugin outputs raw ASCII art that appears as unformatted text in the terminal. Migration to Rich Markdown enables proper rendering with tables, headers, and styled text.

**Design Decisions (Final):**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration approach | Full replacement, no legacy fallback | Clean break, no dual-mode complexity |
| Display mode | Single mode only | User confirmed single mode sufficient |
| Success format | GFM tables + h5 emoji headers | Glamour renders GFM natively |
| Error format | h3 heading + bullet list + numbered steps | Clean, readable, consistent |
| Progress bars | `█░` 12-char in code spans | Matches codex-quota plugin pattern |
| Separators | No `---`, no blockquotes, no HTML | None render properly in Glamour |
| Version bump | 1.7.0 (minor) | New feature, not breaking API |

**Glamour Limitations (Confirmed):**

- ✅ GFM tables render correctly
- ✅ Headers (h1-h6) render correctly
- ✅ Bold, italic, code spans render correctly
- ✅ Bullet lists, numbered lists render correctly
- ❌ `---` horizontal rules NOT rendered properly
- ❌ `>` blockquotes NOT rendered properly
- ❌ ALL HTML stripped (`<table>`, `<details>`, `<colspan>`, etc.)

**Success Output Format:**

```markdown
### 📊 Z.ai GLM Coding Plan — Pro

- **Platform**: ZAI
- **Period**: 2026-03-29 17:00 → 2026-03-30 17:59

##### 🪙 Quota Limits

| Window | Usage | Progress | Resets In |
|--------|------:|----------|-----------|
| ⏱️ 5h Token | 40.5% | `█████░░░░░░░` | 3h 42m |
| 📅 Weekly | 52.0% | `██████░░░░░░` | 4d 12h |
| 🔌 MCP (1 Month) | 12.3% | `█░░░░░░░░░░░` | — |

##### 📊 Quota Usage

| Metric | Value |
|--------|------:|
| 💰 **Token Used** | **405,000 / 1,000,000** |
| 🔌 **MCP Used** | **123 / 1,000** |

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

##### 🔧 Tool Usage (24h)

| Tool | Count |
|------|------:|
| 🔍 Network Searches | 5,678 |
| 🌐 Web Reads | 2,345 |
| 🎭 ZRead Calls | 890 |
```

**Emoji Legend:**

| Emoji | Usage | Context |
|-------|-------|---------|
| 📊 | Title + Quota Usage header | Statistics/overview |
| 🪙 | Quota Limits section | Currency/quota |
| ⏱️ | Time-based windows (5h) | Time-based limits |
| 📅 | Weekly/monthly periods | Calendar periods |
| 🔌 | MCP-related | Plugin connections |
| 💰 | Token usage/budget | Budget tracking |
| 🔢 | Token counts | Numerical data |
| 📞 | API calls | Call counts |
| 🔍 | Network searches | Search tool |
| 🌐 | Web reads | Web tool |
| 📖 | ZRead calls | Read tool |
| 🎭 | ZRead (tool section) | Tool variant |
| 🔧 | Section headers | Tools/MCP |

**Error Output Format (Option 4 - List + Text):**

```markdown
### ⚠️ Authentication Failed

- **Platform**: ZAI
- **Status**: 401 Unauthorized

Your token was rejected by the API.

**How to fix:**
1. Run `/connect` to re-authenticate
2. Check if your subscription has expired
```

**Error Types:**

| Error Type | Title | Metadata Fields |
|------------|-------|-----------------|
| No credentials | No Credentials Found | Platform: N/A |
| Auth failure (401/403) | Authentication Failed | Platform, Status |
| Timeout | Request Failed | Platform, Error message |
| Parse error | Unexpected API Response | Platform, Endpoint |
| Network error | Request Failed | Platform, Error message |

**Files to Delete:**

| File | Reason |
|------|--------|
| `src/utils/box-constants.ts` | ASCII box dimensions no longer needed |

**Files to Rewrite:**

| File | Change |
|------|--------|
| `src/index.ts` | Replace ~250 lines of box formatting with Markdown builders |
| `src/utils/progress-bar.ts` | ASCII `#-` → Unicode `█░` 12-char bars |
| `src/utils/error-formatter.ts` | Box error → Markdown h3 + list format |

**Files Unchanged:**

| File | Reason |
|------|--------|
| `src/api/client.ts` | HTTP layer, no output logic |
| `src/api/platforms.ts` | Platform detection, no output logic |
| `src/api/endpoints.ts` | Endpoint URLs, no output logic |
| `src/utils/token-limits.ts` | Label logic unchanged |
| `src/utils/reset-timer.ts` | Timer logic unchanged |
| `src/utils/date-formatter.ts` | Date formatting unchanged |
| `src/utils/time-window.ts` | Window calculation unchanged |

**Status:** ⏳ PLANNED - v1.7.0 implementation

---

### 1.12 Reset Timestamp Display in Local Timezone (COMPLETED - v1.8.0 ✅)

**Problem Statement:**

The reset timer only shows a **countdown** (`4h 36m`), but not the **actual reset timestamp**. For users in timezones far from UTC (e.g., UTC+12 Pacific/Auckland), the 5-hour rolling window reset often happens at an inconvenient local time (e.g., 1–2 AM), and it's not obvious *when* exactly the quota will reset (Issue #34).

**Solution:**

Show the actual reset time in the user's local timezone alongside the countdown:

```
| ⏱️ 5h Token | 87.0% | ████████████████░░░░░ | 4h 36m (01:34) |
| 📅 Weekly    | 17.0% | ████░░░░░░░░░░░░░░░░ | 6d 16h (Sat 13:48) |
```

**Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timezone display format | `HH:MM` local clock time | Deterministic, user knows their own timezone |
| Timezone abbreviation | Not included | Node.js `toLocaleTimeString` TZ abbreviations unreliable across platforms |
| Long duration format | `Day HH:MM` | Matches issue's proposed format for weekly resets |
| API | `Date.getHours()`, `getMinutes()`, `getDay()` | Native methods, no dependencies, follows existing `date-formatter.ts` pattern |

**Implementation:**

- `formatResetCell()` in `src/index.ts` computes local time from `nextResetTime` Unix timestamp
- Short durations (`<24h`): Returns `${countdown} (${HH}:${MM})`
- Long durations (`≥24h`): Returns `${countdown} (${DayName} ${HH}:${MM})`
- MCP rows without `nextResetTime`: Unchanged (`—`)

**Testing:**

- Integration tests use regex assertions (`assert.match`) for timezone-dependent output
- Pattern: `/\d{2}:\d{2}/` for short durations, `/[A-Z][a-z]{2} \d{2}:\d{2}/` for long durations
- Works deterministically across CI environments (GitHub Actions defaults to UTC)

**Status:** ✅ COMPLETED (2026-06-15) - v1.8.0, resolves Issue #34

---

## 2. OpenCode Plugin Architecture

### 2.1 OpenCode Plugin System

**Important:** This is an OpenCode plugin, not a standalone CLI script. OpenCode handles authentication via its built-in `/connect` command.

**How OpenCode Plugins Work:**

1. OpenCode stores credentials in `~/.local/share/opencode/auth.json`
2. Plugins receive **authentication context** through OpenCode's plugin system
3. Plugins do NOT read auth.json directly - they access credentials via plugin context
4. Plugins do NOT handle authentication prompts - OpenCode manages user authentication flow

**Plugin Context Received:**
```typescript
type PluginContext = {
  project: { path: string }
  directory: string
  worktree: string
  client: {
    app: {
      log: (options: { service: string; level: string; message: string; extra?: Record<string, unknown> }) => Promise<void>
    }
  }
  $: { [command: string]: (...args: string[]) => Promise<any> }
}
```

### 2.2 Provider ID to Platform Mapping

OpenCode determines platform based on the **provider ID** used during `/connect` authentication:

| Provider ID | Platform | API Base URL |
|-------------|----------|---------------|
| `zai-coding-plan` | ZAI | `https://api.z.ai` |
| `zai` | ZAI | `https://api.z.ai` |
| `zhipu` | ZHIPU | `https://open.bigmodel.cn` |
| `zhipuai` | ZHIPU | `https://open.bigmodel.cn` |

**How Authentication Works:**

1. User runs `/connect` command in OpenCode TUI
2. User selects **"Z.AI Coding Plan"** or **"Z.AI"** or **"Zhipu"**
3. OpenCode stores credential in auth.json with the provider ID
4. Plugin receives the provider ID from OpenCode's context
5. Plugin maps provider ID to appropriate platform and endpoints

**Recommended for GLM Usage:**
- Use **"Z.AI Coding Plan"** provider ID for production GLM Coding Plan usage
- Use **"Z.AI"** provider ID for generic Z.AI API access
- Use **"Zhipu"** provider ID for CN platform access

### 2.3 Fallback: Environment Variables

While OpenCode plugins primarily use OpenCode's auth system, environment variables can be used for development and testing:

**Priority:**
1. OpenCode auth context (from `/connect` command) - PRIMARY
2. Environment variables (only for dev/testing) - FALLBACK

**Environment Variable Support:**
```typescript
// For development/testing (not recommended for production use)
if (process.env.ZAI_API_KEY) {
  return { token: process.env.ZAI_API_KEY, platform: 'ZAI' }
}
if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
  return {
    token: (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY)!,
    platform: 'ZHIPU'
  }
}
```

**Note:** Environment variables are intended for development and testing only. For production use, always use OpenCode's `/connect` command.

### 2.4 OpenCode Command & Skill Integration

OpenCode plugins support multiple integration patterns. This section describes how to expose the quota query functionality through OpenCode's command and skill system.

**Architecture Overview:**

| Layer | File | Purpose |
|-------|------|---------|
| **Command** | `.opencode/command/glm_quota.md` | User-facing `/glm_quota` slash command |
| **Agent** | `.opencode/opencode.json` | Orchestrates workflow when command invoked |
| **Skill** | `.opencode/skill/glm-quota-skill.md` | Reusable capability for quota queries |
| **Script** | `scripts/query-usage.mjs` | Actual implementation (Node.js) |
| **Plugin** | `src/index.ts` | Core plugin with TypeScript implementation |

**Command File (`.opencode/command/glm_quota.md`):**

```yaml
---
allowed-tools: all
description: Query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage
agent: glm-quota-agent
---

# GLM Quota Command

Invoke @glm-quota-agent to query usage statistics for the current account.

## Usage

/glm_quota

## Output

Displays:
- Current quota percentages (5-hour token cycle, monthly MCP)
- Model usage statistics (24-hour rolling window)
- MCP tool usage statistics (web_search, web_reader, etc.)
```

**Skill File (`.opencode/skill/glm-quota-skill.md`):**

```yaml
---
name: glm-quota-skill
description: Query GLM Coding Plan usage statistics. Returns quota limits, model usage, and tool usage with formatted output.
allowed-tools: Bash, Read
---

# GLM Quota Skill

Execute the usage query script and return formatted results.

## Critical constraint

**Run the script exactly once** — regardless of success or failure, execute it once and return the outcome.

## Execution

### Run the query

```bash
node scripts/query-usage.mjs
```

> If working directory is elsewhere, use absolute path or cd first.

### Return the result

- **Success**: Display usage statistics in ASCII table format
- **Failure**: Show error details and likely cause with setup instructions

## Prohibited actions

- Do not run multiple queries
- Do not retry automatically after failure
- Do not modify files
```

**Agent Definition (`.opencode/opencode.json`):**

```json
{
  "agent": {
    "glm-quota-agent": {
      "mode": "subagent",
      "description": "Query GLM Coding Plan usage statistics for the current account",
      "system": "You are responsible for querying the user's current usage information. Call @glm-quota-skill to perform the usage query. The skill will run query-usage.mjs automatically, then return the result. Based on the skill output, respond to the user with the formatted usage statistics.",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

**How It Works:**

1. User types `/glm_quota` in OpenCode
2. OpenCode loads command file and invokes agent
3. Agent loads system prompt and invokes skill
4. Skill runs `scripts/query-usage.mjs` (which uses TypeScript plugin logic)
5. Results returned through agent to user

**Alternative: Direct Plugin Invocation**

The plugin can also be invoked directly without commands/skills:

```typescript
// In src/index.ts
export const GlmQuotaPlugin: Plugin = async ({ client }) => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Query Z.ai GLM Coding Plan usage statistics...',
        args: {},
        async execute(args, context) {
          // Implementation directly in plugin
        }
      })
    }
  }
}
```

**Decision: Use Both Patterns**

- **Direct plugin** (`glm_quota` tool) - For programmatic access within OpenCode
- **Command file** (`/glm_quota`) - For user discoverability

This provides maximum flexibility while matching the Claude Code plugin architecture.

---

## 3. Public Distribution - Project Structure

### 3.1 Repository Structure (Updated)

```
opencode-glm-quota/
├── .opencode/                    # OpenCode command/skill/agent structure
│   ├── command/
│   │   └── glm_quota.md          # Command file for /glm_quota
│   ├── skill/
│   │   └── glm-quota-skill.md    # Skill for quota queries
│   └── opencode.json             # Agent definitions
├── src/
│   ├── index.ts                  # Main plugin (TypeScript)
│   ├── api/
│   │   ├── client.ts             # HTTP client for API calls
│   │   ├── endpoints.ts          # Endpoint definitions
│   │   └── ZAI/ZHIPU platform detection
 platforms.ts          #│   └── utils/
│       ├── date-formatter.ts     # formatDateTime()
│       ├── time-window.ts        # getTimeWindow()
│       └── progress-bar.ts       # createProgressBar()
├── scripts/
│   └── query-usage.mjs           # Standalone CLI script (port from Claude Code)
├── dist/                         # Compiled output (generated)
│   ├── index.js
│   ├── index.js.map
│   └── index.d.ts
├── tests/                        # Test suite
│   ├── functional/               # Pure function tests
│   ├── module/                   # Side effect tests with mocks
│   ├── integration/              # End-to-end tests
│   ├── error-handling/           # Error scenarios
│   ├── mocks/                    # Mock infrastructure
│   └── fixtures/                 # Test data
├── package.json                  # npm package configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Public documentation
├── LICENSE                       # MIT License
└── CHANGELOG.md                  # Version history
```

### 3.2 package.json

```json
{
  "name": "opencode-glm-quota",
  "version": "1.0.0",
  "description": "OpenCode plugin to query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build",
    "test": "node --test",
    "lint": "eslint src/"
  },
  "keywords": [
    "opencode",
    "opencode-plugin",
    "zai",
    "z.ai",
    "zhipu",
    "glm",
    "quota",
    "usage",
    "coding-plan",
    "ai",
    "llm"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/opencode-glm-quota.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/opencode-glm-quota/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/opencode-glm-quota#readme",
  "peerDependencies": {
    "@opencode-ai/plugin": ">=0.1.0"
  },
  "devDependencies": {
    "@opencode-ai/plugin": "latest",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.4 .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local

# Test coverage
coverage/
```

### 3.5 .npmignore

```npmignore
# Source files (dist is published)
src/
tsconfig.json

# Development
.github/
.vscode/
.idea/
coverage/

# Git
.git/
.gitignore

# Tests
*.test.ts
__tests__/
```

### 3.6 LICENSE (MIT)

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 3.7 CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-13

### Added
- Initial public release
- Query Z.ai GLM Coding Plan quota limits
- Query model usage statistics (24-hour rolling window)
- Query MCP tool usage statistics
- Support for Global platform (api.z.ai)
- Support for CN platform (open.bigmodel.cn)
- Automatic credential discovery from OpenCode auth.json
- Environment variable fallback (ZAI_API_KEY, ZHIPU_API_KEY)
- ASCII progress bar visualization for quota percentages

### Technical
- Verified against official zai-coding-plugins source code
- Full TypeScript support with type definitions
- Compatible with OpenCode plugin architecture
```

### 3.8 .github/workflows/publish.yml

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3.9 README.md (Public Documentation)

```markdown
# opencode-glm-quota

[![npm version](https://img.shields.io/npm/v/opencode-glm-quota.svg)](https://www.npmjs.com/package/opencode-glm-quota)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenCode plugin to query Z.ai GLM Coding Plan usage statistics.

## Features

- 📊 Query current quota limits (5-hour token cycle, monthly MCP usage)
- 🤖 View model usage statistics (24-hour rolling window)
- 🔧 View MCP tool usage (web_search, web_reader, etc.)
- 🌍 Supports both Global (api.z.ai) and CN (open.bigmodel.cn) platforms
- 🔐 Automatic credential discovery from OpenCode auth.json
- 📈 Visual progress bars for quota percentages

## Installation

### Option 1: npm (Recommended)

\`\`\`bash
npm install opencode-glm-quota
\`\`\`

Then add to your OpenCode config (`~/.config/opencode/config.json`):

\`\`\`json
{
  "plugins": ["opencode-glm-quota"]
}
\`\`\`

### Option 2: From GitHub

\`\`\`bash
npm install github:YOUR_USERNAME/opencode-glm-quota
\`\`\`

### Option 3: Manual Installation

1. Download the latest release from GitHub
2. Copy `dist/index.js` to `~/.config/opencode/plugin/glm-quota.js`

## Authentication Setup

### Method 1: OpenCode Native (Recommended)

\`\`\`bash
opencode auth login
# Select: Z.AI Coding Plan
# Enter your API key
\`\`\`

### Method 2: Environment Variables

\`\`\`bash
# For Global platform (api.z.ai)
export ZAI_API_KEY="your-api-key"

# For CN platform (open.bigmodel.cn)
export ZHIPU_API_KEY="your-api-key"
\`\`\`

## Usage

In OpenCode, simply run:

\`\`\`
/glm_quota
\`\`\`

## Output Example

\`\`\`
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
║  🔧 TOOL/MCP USAGE (24h)                                   ║
╚════════════════════════════════════════════════════════════╝
\`\`\`

## API Reference

This plugin queries three Z.ai monitoring endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/monitor/usage/quota/limit` | Current quota percentages |
| `/api/monitor/usage/model-usage` | Model usage (24h window) |
| `/api/monitor/usage/tool-usage` | MCP tool usage (24h window) |

## Credential Priority

The plugin discovers credentials in this order:

1. **OpenCode auth.json** (`~/.local/share/opencode/auth.json`)
2. **Environment variable** `ZAI_API_KEY` (Global) or `ZHIPU_API_KEY` (CN)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Your Name

## Acknowledgments

- API specification verified from [zai-org/zai-coding-plugins](https://github.com/zai-org/zai-coding-plugins)
- Built for [OpenCode](https://opencode.ai)
```

## 4. Testing Strategy

### 4.1 Test Coverage Goals

**Target:** Production-ready coverage (85% threshold)

**Test Categories:**
1. **Functional Tests (40%)** - Pure functions, no side effects
2. **Module Tests (30%)** - Side effects with mocked dependencies
3. **Integration Tests (20%)** - Multiple modules working together
4. **Contract Tests (10%)** - Type/API compliance validation

### 4.2 Mock Infrastructure

**Node.js Native Test Runner + Undici MockAgent:**

Following Node.js official documentation, we use `undici` for HTTP mocking:
- `MockAgent` from `undici` package
- `setGlobalDispatcher()` for global request interception
- Type-safe mock instances with `ReturnType<T>`

### 4.3 TypeScript Configuration

**Separate tsconfig.test.json extending main config:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./test-dist",
    "baseUrl": ".",
    "strict": false,
    "include": ["tests/**/*.test.ts", "src/**/*.ts"]
  }
}
```

### 4.4 Test File Structure

```
tests/
├── functional/
│   ├── date-formatter.test.ts      # formatDateTime(), getTimeWindow(), createProgressBar()
│   ├── time-window.test.ts           # Mock timers for time window calculation
│   ├── progress-bar.test.ts          # createProgressBar() edge cases
│   ├── token-masking.test.ts         # maskToken(), sanitizeErrorMessage()
│   └── error-sanitization.test.ts    # Security-focused error handling
├── module/
│   ├── credential-discovery.test.ts  # getCredentials(), provider ID mapping
│   ├── platform-mapping.test.ts      # detectPlatformFromProviderId()
│   └── response-processing.test.ts   # processQuotaLimit()
├── integration/
│   └── full-query-pipeline.test.ts  # End-to-end credential → API → output
├── error-handling/
│   ├── network-errors.test.ts        # Timeout, connection refused, DNS failures
│   ├── auth-errors.test.ts          # 401, 403 responses
│   ├── api-errors.test.ts           # 404, 429, 500 responses (NO retry logic tests)
│   └── parse-errors.test.ts         # Invalid JSON, missing fields
├── mocks/
│   ├── https.mock.ts              # Undici MockAgent wrapper
│   ├── fs.mock.ts                # File system mocking
│   ├── process.mock.ts            # Environment variable mocking
│   └── types.ts                 # Shared mock types
└── fixtures/
    ├── auth-valid.json
    ├── auth-zai-coding-plan.json
    ├── auth-zhipu.json
    ├── api-quota-success.json
    ├── api-model-success.json
    ├── api-tool-success.json
    └── api-error-401.json
```

### 4.5 Updated package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build",
    "test": "node --test --experimental-test-coverage --test-coverage-threshold=85 --test-coverage-reporters=lcov",
    "test:watch": "node --test --watch",
    "test:unit": "node --test tests/functional/*.test.ts tests/module/*.test.ts",
    "test:integration": "node --test tests/integration/*.test.ts tests/contract/*.test.ts tests/error-handling/*.test.ts",
    "test:coverage": "node --test --experimental-test-coverage --test-coverage-threshold=85 --test-coverage-reporters=lcov --test-coverage-reporters=html --test-coverage-directory=./coverage",
    "lint": "eslint src/ --ext .ts",
    "lint:fix": "eslint src/ --ext .ts --fix"
  },
  "devDependencies": {
    "@opencode-ai/plugin": "latest",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Note:** Zod and undici dependencies will be added in v1.1 after collecting real API response data. Initial release focuses on core functionality with type guards instead of schemas.

**DevDependencies Added:**
```json
"devDependencies": {
  "@opencode-ai/plugin": "latest",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "undici": "^6.0.0",
  "zod": "^3.22.0"
}
```

### 4.6 Error Handling Approach

**TypeScript Best Practices Applied:**

1. **Custom Error Classes** - NetworkError, AuthenticationError, ApiError, ParseError
2. **Type-safe error handling** - Annotate with types, proper error names
3. **No silent failures** - Propagate or log all errors
4. **Test all error paths** - Network (timeout, refused, DNS), Auth (401, 403), API (429, 500), Parse (invalid JSON, missing fields)
5. **Fail-fast philosophy** - If any endpoint fails, display error and stop. Do NOT retry or show partial data (matches reference script behavior)
6. **Categorized Error Tests** - Separate describe blocks for Network, Auth, API, Parse errors
7. **Security logging** - Ensure tokens never appear in error messages (sanitize before logging)
8. **Type guards instead of schemas** - Use runtime type guards for response validation. Zod schemas will be added in v1.1 after collecting real API responses.

### 4.7 Best Practices Alignment

**From Node.js Testing Best Practices (goldbergyoni/nodejs-testing-best-practices):**

✅ **AAA Pattern** - Arrange, Act, Assert for all tests  
✅ **Test 5 Outcomes** - Response, New State, External Calls, Message Queues, Observability  
✅ **Full Response Object Assertion** - Use `toMatchObject()` for API responses  
✅ **Clean Slate Per Test** - `beforeEach()` to reset mocks  
✅ **Deny All Outgoing Requests** - Block unknown HTTP calls in tests  
✅ **Partial Mocks Avoided** - Replace entire objects, not partial implementations  
✅ **Type Your Mocks** - Use type-safe mock functions with `ReturnType<T>`  
✅ **Network Chaos Simulation** - Test timeouts, retries, connection failures  
✅ **External Call Validation** - Assert request URLs, bodies, headers  
✅ **Schema Validation** - Zod schemas for API contract testing  

---

## 5. Complete Plugin Source Code

### 5.1 src/index.ts

```typescript
// src/index.ts
// OpenCode Plugin for Z.ai GLM Coding Plan Usage Query
// 
// Package: opencode-glm-quota
// Repository: https://github.com/YOUR_USERNAME/opencode-glm-quota
// License: MIT
//
// API verified from: zai-org/zai-coding-plugins/glm-plan-usage

import { type Plugin, tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import * as https from "https"

// ============================================================================
// CONSTANTS - Verified from official zai-coding-plugins source
// ============================================================================

const PLUGIN_VERSION = "1.0.0"

const ENDPOINTS = {
  ZAI: {
    modelUsage: 'https://api.z.ai/api/monitor/usage/model-usage',
    toolUsage: 'https://api.z.ai/api/monitor/usage/tool-usage',
    quotaLimit: 'https://api.z.ai/api/monitor/usage/quota/limit'
  },
  ZHIPU: {
    modelUsage: 'https://open.bigmodel.cn/api/monitor/usage/model-usage',
    toolUsage: 'https://open.bigmodel.cn/api/monitor/usage/tool-usage',
    quotaLimit: 'https://open.bigmodel.cn/api/monitor/usage/quota/limit'
  }
} as const

const CANDIDATE_PROVIDER_IDS = [
  'zai-coding-plan', 'z-ai-coding-plan', 'z.ai-coding-plan',
  'zai', 'z-ai', 'z.ai', 'zhipu', 'zhipuai'
]

// ============================================================================
// TYPES
// ============================================================================

interface QuotaLimitItem {
  type: string
  percentage: number
  currentValue?: number
  usage?: number
  usageDetails?: Record<string, unknown>
}

interface QuotaLimitResponse {
  limits?: QuotaLimitItem[]
  [key: string]: unknown
}

interface ApiResponse {
  data?: Record<string, unknown>
  [key: string]: unknown
}

type Platform = 'ZAI' | 'ZHIPU'

interface Credentials {
  token: string
  platform: Platform
}

// ============================================================================
// CREDENTIAL DISCOVERY
// ============================================================================

function getAuthFilePath(): string {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'opencode', 'auth.json'
    )
  }
  return path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json')
}

function extractKeyFromEntry(entry: unknown): string | null {
  if (typeof entry === 'string') return entry
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry as Record<string, unknown>
    for (const keyName of ['apiKey', 'api_key', 'token', 'key', 'accessToken', 'auth_token']) {
      if (typeof obj[keyName] === 'string') return obj[keyName] as string
    }
  }
  return null
}

function detectPlatformFromProviderId(providerId: string): Platform {
  const lower = providerId.toLowerCase()
  if (lower.includes('zhipu') || lower.includes('bigmodel')) return 'ZHIPU'
  return 'ZAI'
}

async function getCredentials(): Promise<Credentials | null> {
  // Priority 1: OpenCode auth.json (PRIMARY - OpenCode handles authentication)
  // Note: Plugin receives auth context automatically via OpenCode plugin system
  // We access auth.json for development/fallback purposes only
  
  const authPath = getAuthFilePath()
  if (fs.existsSync(authPath)) {
    try {
      const content = fs.readFileSync(authPath, 'utf-8')
      const authData = JSON.parse(content) as Record<string, unknown>
      for (const providerId of CANDIDATE_PROVIDER_IDS) {
        const entry = authData[providerId]
        if (entry) {
          const token = extractKeyFromEntry(entry)
          if (token) {
            // Provider ID determines platform (no URL parsing needed)
            return { token, platform: detectPlatformFromProviderId(providerId) }
          }
        }
      }
    } catch (error) {
      // Silent fail - let OpenCode handle authentication UI
      return null
    }
  }

  // Priority 2: Environment variables (FALLBACK for development/testing only)
  if (process.env.ZAI_API_KEY) {
    return { token: process.env.ZAI_API_KEY, platform: 'ZAI' }
  }
  if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
    return {
      token: (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY)!,
      platform: 'ZHIPU'
    }
  }

  // No credentials found
  return null
}

// ============================================================================
// UTILITY FUNCTIONS - Verified from official source
// ============================================================================

function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function getTimeWindow(): { startTime: string; endTime: string } {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), 0, 0, 0)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999)
  return { startTime: formatDateTime(startDate), endTime: formatDateTime(endDate) }
}

function processQuotaLimit(data: QuotaLimitResponse): QuotaLimitResponse {
  if (!data?.limits) return data
  data.limits = data.limits.map(item => {
    if (item.type === 'TOKENS_LIMIT') {
      return { type: 'Token usage(5 Hour)', percentage: item.percentage }
    }
    if (item.type === 'TIME_LIMIT') {
      return {
        type: 'MCP usage(1 Month)',
        percentage: item.percentage,
        currentUsage: item.currentValue,
        total: item.usage,
        usageDetails: item.usageDetails
      }
    }
    return item
  })
  return data
}

function makeRequest(url: string, authToken: string, queryParams?: string): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const fullPath = queryParams ? `${parsedUrl.pathname}?${queryParams}` : parsedUrl.pathname

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: {
        'Authorization': authToken,  // NO "Bearer" prefix
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          return
        }
        try {
          resolve(JSON.parse(data) as ApiResponse)
        } catch {
          reject(new Error(`Invalid JSON: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

function createProgressBar(percentage: number, width: number): string {
  const pct = Math.min(100, Math.max(0, percentage))
  const filled = Math.round((pct / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

// ============================================================================
// MAIN QUERY FUNCTION
// ============================================================================

async function queryAllUsage(credentials: Credentials): Promise<string> {
  const { token, platform } = credentials
  const endpoints = ENDPOINTS[platform]
  const { startTime, endTime } = getTimeWindow()
  const queryParams = `startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`

  const lines: string[] = []

  // Header
  lines.push('╔════════════════════════════════════════════════════════════╗')
  lines.push('║           Z.ai GLM Coding Plan Usage Statistics            ║')
  lines.push('╠════════════════════════════════════════════════════════════╣')
  lines.push(`║  Platform: ${platform.padEnd(47)}║`)
  lines.push(`║  Period: ${startTime} → ${endTime}  ║`)
  lines.push('╠════════════════════════════════════════════════════════════╣')

  // Quota Limits
  try {
    const quotaResponse = await makeRequest(endpoints.quotaLimit, token)
    const quotaData = quotaResponse.data 
      ? processQuotaLimit(quotaResponse.data as QuotaLimitResponse)
      : quotaResponse

    lines.push('║  📊 QUOTA LIMITS                                           ║')
    lines.push('╟────────────────────────────────────────────────────────────╢')

    if (quotaData.limits && Array.isArray(quotaData.limits)) {
      for (const limit of quotaData.limits) {
        const pct = typeof limit.percentage === 'number' ? limit.percentage : 0
        const bar = createProgressBar(pct, 30)
        const typeStr = String(limit.type || 'Unknown').padEnd(20)
        const pctStr = `${pct.toFixed(1)}%`.padStart(6)
        lines.push(`║  ${typeStr} [${bar}] ${pctStr} ║`)

        if (limit.currentUsage !== undefined && limit.total !== undefined) {
          const usageStr = `     Used: ${limit.currentUsage}/${limit.total}`.padEnd(56)
          lines.push(`║  ${usageStr}║`)
        }
      }
    } else {
      lines.push('║  No quota data available                                   ║')
    }
  } catch (error) {
    lines.push(`║  ❌ Quota query failed: ${String(error).substring(0, 34).padEnd(34)}║`)
  }

  lines.push('╠════════════════════════════════════════════════════════════╣')

  // Model Usage
  try {
    const modelResponse = await makeRequest(endpoints.modelUsage, token, queryParams)
    const modelData = modelResponse.data || modelResponse

    lines.push('║  🤖 MODEL USAGE (24h)                                      ║')
    lines.push('╟────────────────────────────────────────────────────────────╢')

    const modelJson = JSON.stringify(modelData, null, 2)
    const modelLines = modelJson.split('\n').slice(0, 8)
    for (const line of modelLines) {
      lines.push(`║  ${line.substring(0, 56).padEnd(56)}║`)
    }
    if (modelJson.split('\n').length > 8) lines.push('║  ...                                                       ║')
  } catch (error) {
    lines.push('║  🤖 MODEL USAGE                                            ║')
    lines.push(`║  ❌ Query failed: ${String(error).substring(0, 40).padEnd(40)}║`)
  }

  lines.push('╠════════════════════════════════════════════════════════════╣')

  // Tool Usage
  try {
    const toolResponse = await makeRequest(endpoints.toolUsage, token, queryParams)
    const toolData = toolResponse.data || toolResponse

    lines.push('║  🔧 TOOL/MCP USAGE (24h)                                   ║')
    lines.push('╟────────────────────────────────────────────────────────────╢')

    const toolJson = JSON.stringify(toolData, null, 2)
    const toolLines = toolJson.split('\n').slice(0, 8)
    for (const line of toolLines) {
      lines.push(`║  ${line.substring(0, 56).padEnd(56)}║`)
    }
    if (toolJson.split('\n').length > 8) lines.push('║  ...                                                       ║')
  } catch (error) {
    lines.push('║  🔧 TOOL/MCP USAGE                                         ║')
    lines.push(`║  ❌ Query failed: ${String(error).substring(0, 40).padEnd(40)}║`)
  }

  // Footer
  lines.push('╚════════════════════════════════════════════════════════════╝')

  return lines.join('\n')
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const GlmQuotaPlugin: Plugin = async ({ client }) => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage. Shows current usage percentage for 5-hour prompt cycle and monthly MCP limits.',
        args: {},
        async execute(args, context) {
          try {
            const credentials = await getCredentials()

            if (!credentials) {
              // Throw error to let OpenCode handle authentication
              throw new Error(
                'Not authenticated with Z.AI. Please run `/connect` command in OpenCode TUI and select "Z.AI Coding Plan" or "Z.AI".'
              )
            }

            return await queryAllUsage(credentials)
          } catch (error) {
            // Log error via OpenCode's logging system
            await client.app.log({
              service: 'glm-quota',
              level: 'error',
              message: error instanceof Error ? error.message : String(error)
            })
            throw error  // Let OpenCode display the error to user
          }
        }
      })
    }
  }
}

export default GlmQuotaPlugin
```

---

## 6. Installation Guide (For End Users)

### 6.1 Install from npm (Recommended)

```bash
# Install the plugin
npm install opencode-glm-quota

# Or using yarn
yarn add opencode-glm-quota

# Or using pnpm
pnpm add opencode-glm-quota
```

Then configure OpenCode to use the plugin. Add to `~/.config/opencode/config.json`:

```json
{
  "plugins": ["opencode-glm-quota"]
}
```

### 6.2 Install from GitHub

```bash
# Install directly from GitHub
npm install github:YOUR_USERNAME/opencode-glm-quota

# Or specific version/tag
npm install github:YOUR_USERNAME/opencode-glm-quota#v1.0.0
```

### 6.3 Manual Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/opencode-glm-quota.git
cd opencode-glm-quota

# Install dependencies and build
npm install
npm run build

# Copy to OpenCode plugin directory
mkdir -p ~/.config/opencode/plugin
cp dist/index.js ~/.config/opencode/plugin/glm-quota.js
```

### 6.4 Authentication Setup

**Method 1: OpenCode Native (Required)**

This plugin is automatically configured when you authenticate with Z.AI in OpenCode:

1. Run `/connect` command in OpenCode TUI
2. Select **"Z.AI Coding Plan"** (recommended for GLM usage monitoring) or **"Z.AI"** (generic)
3. Enter your API key
4. The plugin will automatically use your stored credentials

**No manual configuration required.**

**Note:** This plugin requires authentication through OpenCode's `/connect` command. It does not support environment variables or manual API key configuration for production use.

### 6.5 Usage

After authentication, simply run:

```bash
/glm_quota
```

The plugin will:
- Detect your authentication (Z.AI Coding Plan or Z.AI)
- Query the appropriate API endpoints
- Display usage statistics with progress bars

**Note:** Environment variables (`ZAI_API_KEY`, `ZHIPU_API_KEY`) are supported only for development and testing purposes. For production use, always use OpenCode's `/connect` command.

### 6.5 Usage

```bash
# Start OpenCode
opencode

# Query usage
/glm_quota
```

---

## 7. Publishing Guide (For Maintainers)

### 7.1 Initial Setup

```bash
# 1. Create GitHub repository
# Go to github.com and create: YOUR_USERNAME/opencode-glm-quota

# 2. Clone and setup
git clone https://github.com/YOUR_USERNAME/opencode-glm-quota.git
cd opencode-glm-quota

# 3. Initialize npm package
npm init
# Fill in details as per package.json template above

# 4. Install dependencies
npm install --save-dev typescript @types/node @opencode-ai/plugin

# 5. Create project structure
mkdir -p src .github/workflows
# Copy files from this PRD

# 6. Build
npm run build
```

### 7.2 Publish to npm

```bash
# 1. Create npm account at npmjs.com if you don't have one

# 2. Login to npm
npm login

# 3. Publish (first time)
npm publish

# 4. For updates, bump version first
npm version patch  # or minor, or major
npm publish
```

### 7.3 Setup GitHub Actions for Auto-Publish

1. Go to npmjs.com → Account → Access Tokens → Generate New Token (Automation)
2. Copy the token
3. Go to GitHub repo → Settings → Secrets → Actions → New repository secret
4. Name: `NPM_TOKEN`, Value: paste the token
5. Now when you create a GitHub Release, it will auto-publish to npm

### 7.4 Creating a Release

```bash
# Tag the version
git tag v1.0.0
git push origin v1.0.0

# Or create release via GitHub UI:
# Go to repo → Releases → Create new release → Select tag
```

---

## 8. Expected Output Examples

### 8.1 Successful Query (Markdown - v1.7.0+)

```markdown
### 📊 Z.ai GLM Coding Plan — Pro

- **Platform**: ZAI
- **Period**: 2026-03-29 17:00 → 2026-03-30 17:59

##### 🪙 Quota Limits

| Window | Usage | Progress | Resets In |
|--------|------:|----------|-----------|
| ⏱️ 5h Token | 40.5% | `█████░░░░░░░` | 3h 42m |
| 📅 Weekly | 52.0% | `██████░░░░░░` | 4d 12h |
| 🔌 MCP (1 Month) | 12.3% | `█░░░░░░░░░░░` | — |

##### 📊 Quota Usage

| Metric | Value |
|--------|------:|
| 💰 **Token Used** | **405,000 / 1,000,000** |
| 🔌 **MCP Used** | **123 / 1,000** |

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

##### 🔧 Tool Usage (24h)

| Tool | Count |
|------|------:|
| 🔍 Network Searches | 5,678 |
| 🌐 Web Reads | 2,345 |
| 🎭 ZRead Calls | 890 |
```

### 8.1a Successful Query (Legacy ASCII - v1.6.x)

<details>
<summary>Legacy ASCII output (click to expand)</summary>

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

</details>

### 8.2 Error: No Credentials Found (Markdown - v1.7.0+)

```markdown
### ⚠️ No Credentials Found

- **Platform**: N/A

No Z.ai or ZHIPU authentication detected.

**How to fix:**
1. Run `/connect` in OpenCode to authenticate
2. Or set `ZAI_API_KEY` / `ZHIPU_API_KEY` environment variable
```

### 8.3 Error: Authentication Failed (Markdown - v1.7.0+)

```markdown
### ⚠️ Authentication Failed

- **Platform**: ZAI
- **Status**: 401 Unauthorized

Your token was rejected by the API.

**How to fix:**
1. Run `/connect` to re-authenticate
2. Check if your subscription has expired
```

### 8.4 Error: Request Timeout (Markdown - v1.7.0+)

```markdown
### ⚠️ Request Failed

- **Platform**: ZAI
- **Error**: Connection timeout after 10s

The API server did not respond in time.

**Suggestions:**
1. Check your network connection
2. Try again in a few minutes
```

### 8.5 Error: Unexpected API Response (Markdown - v1.7.0+)

```markdown
### ⚠️ Unexpected API Response

- **Platform**: ZAI
- **Endpoint**: quota/limit

The API returned data in an unexpected format. This may be a temporary issue or a version mismatch. Please try again later.
```

---

## 9. Verification Summary

### 9.1 Items Verified from Official Source ✅

| Item | Source Location | Status |
|------|-----------------|--------|
| API Endpoints | Lines 40-49 | ✅ VERIFIED |
| Auth Header Format | Line 103 | ✅ VERIFIED (No Bearer prefix) |
| Platform Detection Logic | Lines 35-51 | ✅ VERIFIED |
| Time Window Calculation | Lines 56-67 | ✅ VERIFIED |
| Date Format Function | Lines 70-78 | ✅ VERIFIED |
| Query Parameter Format | Line 83 | ✅ VERIFIED |
| Response Processing | Lines 86-107 | ✅ VERIFIED |
| HTTP Request Headers | Lines 103-106 | ✅ VERIFIED |

### 9.2 Previous PRD Errors Corrected

| Error | Correction |
|-------|------------|
| Fabricated endpoint `/tools/mcp/usage_query` | Actual: `/api/monitor/usage/*` (3 endpoints) |
| Used `Bearer` token prefix | Actual: Raw token without prefix |
| Wrong base URL path | Actual: `api.z.ai` domain + `/api/monitor/usage/` |
| Assumed single endpoint | Actual: Three separate endpoints |
| Missing query parameters | Actual: `startTime` and `endTime` required |

---

## 10. Version History

 | Version | Date | Changes |
|---------|------|---------|
| 9.0 | 2026-03-30 | Added Section 1.11: Markdown Output Format (v1.7.0) — full migration from ASCII box to Rich Markdown for Glamour TUI. Updated Section 8 with new Markdown output examples (success + error formats). Design decisions: single mode, GFM tables, h5 emoji headers, `█░` progress bars, list-based errors, no `---`/blockquotes/HTML. |
| 8.3 | 2026-01-21 | Added Slice 4.5: Next Reset Time display |
| 8.2 | 2026-01-14 | Added comprehensive testing strategy with production-ready coverage (85%) - Node.js native test runner + Undici MockAgent, TypeScript-aligned categorization (Functional/Module/Integration/Contract/Error), custom error classes, Zod schema validation, and detailed implementation roadmap |

---

## 11. References

| Resource | URL |
|----------|-----|
| Official Plugin Source | `github.com/zai-org/zai-coding-plugins/blob/main/plugins/glm-plan-usage/skills/usage-query-skill/scripts/query-usage.mjs` |
| npm Package | `npmjs.com/package/opencode-glm-quota` |
| GitHub Repository | `github.com/YOUR_USERNAME/opencode-glm-quota` |
| Z.ai Coding Plan Docs | `docs.z.ai/devpack/overview` |
| OpenCode Plugin Docs | `opencode.ai/docs/plugins/` |

---

*Document verified against official source code. Ready for public distribution via npm and GitHub.*
