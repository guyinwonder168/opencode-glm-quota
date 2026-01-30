# AGENTS.md
This is an OpenCode plugin project for querying Z.ai GLM Coding Plan usage statistics.

**Current Phase:** Implementation
**Status:** PRD finalized, ready for implementation
**Architecture:** OpenCode Plugin (not standalone CLI script)

This document provides build commands, code style guidelines, and conventions for agentic coding agents working on this OpenCode plugin repository.

## Build & Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Clean build artifacts
npm run clean

# Run all tests
npm run test

# Run specific test file
npm run test -- path/to/test.test.ts

# Watch mode during development (if configured)
npm run test -- --watch

# Lint source code
npm run lint

# Prepare for npm publish
npm run prepublishOnly
```

## GitHub Actions CI/CD

This project uses GitHub Actions for automated CI/CD.

### CI Workflow (Automatic)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**What It Does:**
- Tests code on multiple Node.js versions (18.x, 20.x, 22.x)
- Runs linting (`npm run lint`)
- Builds TypeScript (`npm run build`)
- Runs all tests (`npm test`)
- Validates documentation links
- Uploads test coverage artifacts

**View Results:**
- Check the "Actions" tab in GitHub repository
- Green checkmark ✅ = All tests passed
- Red X ❌ = Something failed (check logs)

### Publish Workflow (On Release)

**Triggers:**
- GitHub release published

**What It Does:**
- Builds, tests, and lints code
- Publishes package to npm with provenance
- Creates release artifacts

**Setup Required:**
1. Create npm automation token at https://www.npmjs.com/settings/tokens
2. Add `NPM_TOKEN` to GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Create secret: `NPM_TOKEN`
   - Value: Your npm automation token

**How to Publish:**
```bash
# Using GitHub CLI
gh release create v1.0.0 --generate-notes

# Or via GitHub web UI:
# 1. Go to Releases → Create new release
# 2. Enter version tag (e.g., v1.0.0)
# 3. Add release notes
# 4. Click "Publish release"
```

The workflow automatically publishes to npm when a release is created.

### CI Status Badge

The README includes a CI status badge that shows the current build status:
```
[![Build Status](https://github.com/guyinwonder168/opencode-glm-quota/workflows/CI/badge.svg)]
```

This badge updates automatically with each commit.

## Project Structure

```
src/
  index.ts           # Main plugin entry point
  api/
    client.ts        # HTTPS client with timeout and error handling
    endpoints.ts     # Platform-specific API endpoints
    platforms.ts     # Platform detection and naming
  utils/
    date-formatter.ts # Date/time formatting utilities
    progress-bar.ts   # ASCII progress bar rendering
    time-window.ts    # Rolling window calculation
  integration/
    agents/glm-quota-exec.md     # Minimal executor agent (Markdown)
    command/glm_quota.md         # /glm_quota slash command
    skills/glm-quota/SKILL.md     # Skill documentation (OpenCode spec: skills/<name>/SKILL.md)
  bin/
    install.js                    # Installation script
  dist/                             # Compiled JavaScript (generated)
  tests/                            # Test suite
  package.json                       # Dependencies and scripts
  tsconfig.json                      # TypeScript configuration
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Always use type annotations for function returns
- Use `as const` for constants that shouldn't be modified

### Import Order
1. Core Node.js modules (`fs`, `path`, `os`, `https`)
2. Third-party imports (`@opencode-ai/plugin`)
3. Local imports (if any)
4. Type imports (use `import type` where possible)

```typescript
// ✅ Correct
import * as fs from "fs"
import * as path from "path"
import { type Plugin, tool } from "@opencode-ai/plugin"
```

### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE` for immutable constants
- **Functions**: `camelCase` for regular functions
- **Types/Interfaces**: `PascalCase` (e.g., `ApiResponse`, `Credentials`)
- **Interfaces**: Describe data structures; use for object shapes
- **Type Aliases**: Use for unions, literals, or primitives

```typescript
const ENDPOINTS = { /* ... */ }  // UPPER_SNAKE_CASE
function getCredentials() { }     // camelCase
interface ApiResponse { }         // PascalCase
type Platform = 'ZAI' | 'ZHIPU'   // PascalCase for union types
```

### Error Handling
- Always wrap file operations in try-catch blocks
- Use `null` returns for optional values, not errors
- Include fallback mechanisms (e.g., auth.json → env vars)
- Return user-friendly error messages with setup instructions

```typescript
async function getCredentials(): Promise<Credentials | null> {
  try {
    // Primary method
  } catch {
    // Silent fail, try next method
  }
  // Fallback methods
  return null  // No credentials found
}
```

### API & HTTP Requests
- Use native `https` module (no fetch for Node.js compatibility)
- **CRITICAL**: Do NOT use "Bearer" prefix in Authorization header
- Always validate response status code before processing
- URL-encode query parameters using `encodeURIComponent()`
- Set proper headers: `Authorization`, `Accept-Language`, `Content-Type`

```typescript
headers: {
  'Authorization': authToken,  // NO "Bearer" prefix
  'Accept-Language': 'en-US,en',
  'Content-Type': 'application/json'
}
```

### Date & Time Formatting
- Format: `yyyy-MM-dd HH:mm:ss` (24-hour format)
- Use `padStart(2, '0')` for zero-padded numbers
- Time window: Yesterday at current hour → Today at current hour end

```typescript
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  // ... etc
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
```

### Output Formatting
- Use ASCII box-drawing characters (`╔`, `╠`, `║`, `╚`) for tables
- Pad strings to fixed width: `text.padEnd(width)`
- Progress bars: `█` for filled, `░` for empty
- Truncate long output with ellipsis `...`

### Comments & Documentation
- Use JSDoc-style comments for exported functions
- Inline comments only for non-obvious logic
- Mark sections with separator comments for readability

```typescript
/**
 * Get credentials with priority order
 * 1. OpenCode auth.json
 * 2. Environment variables
 * 3. Legacy Claude Code variables
 */
async function getCredentials(): Promise<Credentials | null> { }
```

### Development Principles

**CRITICAL:** Implementation MUST follow these principles to avoid over-engineering and maintain simplicity.

**YAGNI (You Aren't Gonna Need It):**
- Build only what's needed NOW, not what you might need LATER
- Don't create abstractions without multiple implementations
- Don't optimize prematurely (measure first, then optimize)
- Don't add features not in PRD

**TypeScript Best Practices:**
- Use `unknown` instead of `any` when possible
- Prefer `type` over `interface` for simple shapes
- Use `as const` for literal types to avoid widening
- Use discriminated unions instead of optional properties where appropriate
- Let TypeScript infer types when possible (don't over-annotate)

**Avoid Over-Engineering:**
- Don't create factory patterns when simple functions work
- Don't build generic HTTP client when you only need one endpoint
- Don't add validation libraries for simple type checks
- Don't create config objects when constants work
- Don't abstract every possible future use case

**When to Build Abstractions:**
- ✅ Multiple implementations exist (platform detection, auth methods)
- ✅ Code is duplicated 3+ times
- ✅ Tests reveal the abstraction is needed
- ❌ "Might need this later" - NOT a valid reason
- ❌ "More flexible" - Flexibility without actual need = complexity

**Examples: What to AVOID:**

```typescript
// ❌ OVER-ENGINEERED: Generic HTTP client for 1 endpoint
class HttpClient {
  private baseURL: string;
  private headers: Record<string, string>;
  constructor(baseURL: string, headers: Record<string, string>) {
    this.baseURL = baseURL;
    this.headers = headers;
  }
  async get(path: string, params?: Record<string, string>) {
    // 100 lines of generic implementation
  }
  async post(path: string, body: any) {
    // Not needed for this project
  }
  async put() { /* Not needed */ }
  async delete() { /* Not needed */ }
}

// ✅ SIMPLE: Just make the one request we need
async function makeRequest(url: string, token: string): Promise<ApiResponse> {
  const data = await httpsRequest(url, token);
  return JSON.parse(data);
}

// ❌ OVER-ENGINEERED: Factory pattern for 1 function
class EndpointFactory {
  static create(type: 'quota' | 'model' | 'tool'): Endpoint {
    switch(type) {
      case 'quota': return new QuotaEndpoint();
      case 'model': return new ModelEndpoint();
      case 'tool': return new ToolEndpoint();
    }
  }
}

// ✅ SIMPLE: Just use the endpoints directly
const ENDPOINTS = {
  quota: '/api/monitor/usage/quota/limit',
  model: '/api/monitor/usage/model-usage',
  tool: '/api/monitor/usage/tool-usage'
} as const;

// ❌ OVER-ENGINEERED: Generic validation library
function createValidator<T>(schema: Schema<T>) {
  return (data: unknown): ValidationResult<T> => {
    // 200 lines of generic validation logic
  };
}

// ✅ SIMPLE: Type guards for what we actually need
function isApiResponse(data: unknown): data is ApiResponse {
  return typeof data === 'object' && 'TOKENS_LIMIT' in data;
}
```

**Simple is Better Than Flexible:**
- Simple code is easier to test
- Simple code is easier to debug
- Simple code is easier to maintain
- Flexible without requirements = complex for no reason

**Reference:**
- Implementation plan: `docs/implementation-plan.md` - Follows TDD with vertical slicing
- Code standards: `.opencode/context/core/standards/code.md` - Detailed principles above

### Plugin Architecture (OpenCode Plugin)

**Export Structure:**
```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const GlmQuotaPlugin: Plugin = async ({ client }) => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Query Z.ai GLM Coding Plan usage statistics...',
        args: {},
        async execute(args, context) {
          // Implementation
        }
      })
    }
  }
}

export default GlmQuotaPlugin
```

### Command with Minimal Agent Configuration

To minimize context usage when using `/glm_quota` command, we've configured a specialized minimal agent:

**Agent Definition (in `.opencode/opencode.json`):**
```json
{
  "agent": {
    "glm-quota-exec": {
      "mode": "subagent",
      "system": "You are a minimal tool executor. Your only purpose is to execute the glm_quota tool when requested. Do not explain, reason, or add any commentary. Simply call the tool and return its output directly.",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

**Command File (`.opencode/command/glm_quota.md`):**
```markdown
---
description: Execute GLM quota check
agent: glm-quota-exec
---
Execute glm_quota tool.
```

**How It Works:**
1. User types `/glm_quota` in OpenCode
2. OpenCode loads command file (15 characters - minimal!)
3. System prompt sets agent to minimal executor mode
4. LLM receives minimal instructions: "Execute glm_quota tool"
5. LLM calls `glm_quota` tool directly without reasoning
6. Tool returns results to user

**Context Usage Comparison:**

| Approach | Command File Size | System Prompt | Reasoning | Total Context |
|----------|-------------------|---------------|-----------|----------------|
| Standard command | ~300 chars | Default agent | Full | High |
| Minimal command | ~15 chars | Minimal agent (no reasoning) | None | **Low** |

**Benefits:**
- ✅ Minimal command file content (15 chars vs 300)
- ✅ Minimal agent system prompt (no explanation/reasoning)
- ✅ Direct tool execution without intermediate text
- ✅ Still discoverable in TUI autocomplete
- ✅ Part of OpenCode command system

**Plugin Context Received:**
- `client`: OpenCode SDK client for logging, app context
- `project`: Current project information
- `directory`: Working directory
- `worktree`: Git worktree path
- `$`: Shell commands

**Installation & Configuration**

The package includes an automatic installer that configures OpenCode:

```bash
npm install opencode-glm-quota
npx opencode-glm-quota install
```

**What installer does:**
- Copies `/glm_quota` command to `~/.config/opencode/command/glm_quota.md`
- Copies skill documentation to `~/.config/opencode/skills/glm-quota/SKILL.md` (OpenCode spec)
- Automatically adds `opencode-glm-quota` to your OpenCode config's plugin array
- Merges `glm-quota-exec` agent configuration into `~/.config/opencode/opencode.jsonc`
- Supports `--force` flag to overwrite existing files

**Installer fixes (v1.3.0):**
- ✅ Package name: Uses `opencode-glm-quota` (not scoped `@opencode-glm-quota/plugin`)
- ✅ Bin command: `opencode-glm-quota install` (not `opencode-glm-quota-install`)
- ✅ Entry point: Removed fragile condition, always runs main() function
- ✅ Config merging: Only creates the array being used (`plugin` or `plugins`), not both
- ✅ Skill structure: Follows OpenCode spec (`skills/<name>/SKILL.md`)
- ✅ No manual config: Users don't need to edit opencode.json manually

**Key Differences from Standalone Scripts:**
- `client`: OpenCode SDK client for logging, app context
- `project`: Current project information
- `directory`: Working directory
- `worktree`: Git worktree path
- `$`: Shell commands

**Key Differences from Standalone Scripts:**
- ❌ No direct file I/O for auth.json
- ❌ No manual authentication prompts
- ❌ No environment variable parsing as primary method
- ✅ Receive auth context from OpenCode automatically
- ✅ Use `client.app.log()` for structured logging
- ✅ Throw errors and let OpenCode display them

### Critical Plugin Rules

**CRITICAL: Plugin Loader Behavior**

OpenCode's plugin loader (`packages/opencode/src/plugin/index.ts`) iterates through **ALL exports** from a module and tries to initialize each one as a plugin:

```typescript
for (const [_name, fn] of Object.entries<PluginInstance>(mod)) {
  const init = await fn(input)  // ← EVERY export is called here!
  hooks.push(init)
}
```

**Rule 1: Correct Import Paths**

```typescript
// ❌ WRONG
import { tool } from "@opencode-ai/plugin"

// ✅ CORRECT
import { tool } from "@opencode-ai/plugin/tool"
```

The `tool` helper is exported from the subpath `/tool`, not from the main package index.

**Rule 2: Only Export Plugin Functions**

```typescript
// ❌ WRONG - Loader will try to initialize these as plugins
export type Platform = 'ZAI' | 'ZHIPU'
export interface Credentials { token: string; platform: Platform }
export function getProviderPlatform(...) { ... }
export function createCredentialError() { ... }
export function getCredentials() { ... }
export const MyPlugin: Plugin = async (ctx) => { ... }

// ✅ CORRECT - Only plugin functions are exported
type Platform = 'ZAI' | 'ZHIPU'              // Internal
interface Credentials { token: string; platform: Platform } // Internal
function getProviderPlatform(...) { ... }           // Internal
function createCredentialError() { ... }               // Internal
function getCredentials() { ... }                    // Internal
export const MyPlugin: Plugin = async (ctx) => { ... }
export default MyPlugin
```

**Why This Matters:**

If you export non-plugin items (types, interfaces, helper functions), the loader will:
1. Try to call types/interfaces as functions → TypeError
2. Call helper functions → They don't return Hooks object → Error
3. Eventually call the actual plugin → Might work, but errors from previous attempts cause startup failure

**What Happens with Wrong Exports:**

```typescript
// File with 6 exports
export type Platform = ...
export interface Credentials { ... }
export function getProviderPlatform() { ... }
export function createCredentialError() { ... }
export function getCredentials() { ... }
export const GlmQuotaPlugin: Plugin = ...
export default GlmQuotaPlugin

// Loader does:
const init = await Platform()        // ❌ TypeError: Platform is a type, not a function
const init = await Credentials()     // ❌ TypeError: Credentials is an interface
const init = await getProviderPlatform() // ❌ Returns null, not a Hooks object
const init = await createCredentialError() // ❌ Returns string, not a Hooks object
const init = await getCredentials()       // ❌ Returns null, not a Hooks object
const init = await GlmQuotaPlugin() // ✅ Finally works!
```

**Best Practice:**

Keep helper functions internal (remove `export` keyword) to prevent the plugin loader from attempting to initialize them as plugins.

**Reference Error:**
```
TypeError: null is not an object (evaluating 'hook.config')
```

This error occurs when a non-plugin export is called and returns something other than a valid Hooks object.

## Testing
- Write tests in TypeScript with `.test.ts` extension
- Use Node.js built-in test runner (`node --test`)
- Mock file system and HTTP requests in tests
- Test error paths (missing credentials, API failures, timeout, parse errors)
- **No retry logic tests** - Plugin uses fail-fast philosophy (user-requested)

**Test Categories:**
1. **Functional tests** - Pure functions (formatDateTime, getTimeWindow, processQuotaLimit, createProgressBar)
2. **Module tests** - With mocks (getCredentials, platform mapping, makeRequest)
3. **Integration tests** - End-to-end credential → API → output flow
4. **Error handling tests** - Network, auth, API, parse errors (NO retry logic)
5. **Security tests** - Token masking, file permission validation, error sanitization

## Platform Detection
- **Provider ID determines platform**: OpenCode's authentication system provides provider ID (`zai-coding-plan`, `zai`, `zhipu`)
- **Endpoints**: Three separate monitoring endpoints per platform (verified from `docs/query-usage.mjs`)
- **Supported platforms**:
  - ZAI (api.z.ai) - Global platform
  - ZHIPU (open.bigmodel.cn, dev.bigmodel.cn) - CN platform
- **No URL parsing**: Plugin receives provider ID directly from OpenCode, no URL detection needed

## Authentication & Credential Discovery

**OpenCode Plugin Architecture:**
1. **Primary:** OpenCode auth.json via `/connect` command (automated by OpenCode)
   - Location: `~/.local/share/opencode/auth.json`
   - Provider IDs: `zai-coding-plan`, `zai`, `zhipu`
   - Plugin receives auth context automatically via OpenCode's plugin system

**Environment Variables (Fallback - Development/Testing Only):**
2. `ZAI_API_KEY` - For Z.AI platform
3. `ZHIPU_API_KEY` or `ZHIPUAI_API_KEY` - For ZHIPU platform

**Important:**
- Plugins do NOT read auth.json directly - they receive auth context from OpenCode
- Plugins do NOT handle authentication prompts - OpenCode manages user authentication
- Environment variables are intended for development and testing only
- For production use, always authenticate via OpenCode's `/connect` command

**Documentation:** See CHANGELOG.md for detailed change history and implementation decisions.

## Critical Implementation Details

**API Endpoints** (verified from `docs/query-usage.mjs`):
- `/api/monitor/usage/quota/limit` - Current quotas (no query params)
- `/api/monitor/usage/model-usage` - Model stats (with time range)
- `/api/monitor/usage/tool-usage` - MCP tool usage (with time range)

**Authentication**:
- **Auth Header**: Raw token, NO "Bearer" prefix (CRITICAL)
- **Time Window**: 24-hour rolling window from yesterday at current hour to today at current hour end

**Platform Detection**:
- Provider ID determines platform (ZAI vs ZHIPU)
- No URL parsing needed - plugin receives provider ID from OpenCode context

**Error Handling Philosophy** (based on feedback):
- **No retry logic** - Fail fast on errors, let user retry when ready
- **Sequential requests** - Query endpoints one by one (not parallel)
- **No auth state caching** - Always check auth.json on each call (status checker philosophy)
- **Silent failure logging** - Log auth.json parse errors for debugging

**Security**:
- Token sanitization in all error messages
- File permission validation for auth.json (check for 0600 on Unix)
- No token exposure in logs or errors

## Verification Before Completion

**Local Testing:**
Always run these before pushing:
1. `npm run build` - Ensure TypeScript compiles without errors
2. `npm run lint` - Check for linting issues
3. `npm run test` - Verify all tests pass
4. Manual test: `/glm_quota` command in OpenCode

**CI/CD Verification:**
After pushing, verify GitHub Actions workflow:
5. Check CI workflow runs successfully in GitHub Actions tab
6. Verify all Node.js versions (18, 20, 22) pass tests
7. Confirm documentation validation passes

**Before Publishing:**
Before creating a GitHub release:
8. All CI checks must pass
9. Update version in package.json (if exists)
10. Update CHANGELOG.md with changes
11. Create GitHub release (workflow publishes to npm automatically)

## Common Pitfalls
- ❌ Adding "Bearer " prefix to Authorization header
- ❌ Using single fabricated endpoint instead of three actual endpoints
- ❌ Missing URL encoding for query parameters
- ❌ Not handling missing credentials gracefully
- ❌ Forgetting to pad strings in ASCII output
- ❌ Assuming specific auth.json structure (use flexible discovery)
