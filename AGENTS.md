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

## Project Structure

```
src/
  index.ts           # Main plugin entry point
dist/               # Compiled JavaScript (generated)
package.json         # Dependencies and scripts
tsconfig.json        # TypeScript configuration
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

### Plugin Architecture
- Export a `Plugin` function that returns tool definitions
- Use `tool()` helper for each tool
- Provide clear descriptions for tool invocation
- Handle errors gracefully with helpful user messages

```typescript
export const GlmQuotaPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Clear description of what this does',
        args: {},
        async execute(args, context) {
          // Implementation
        }
      })
    }
  }
}
```

## Testing
- Write tests in TypeScript with `.test.ts` extension
- Use Node.js built-in test runner (`node --test`)
- Mock file system and HTTP requests in tests
- Test error paths (missing credentials, API failures)

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
Always run:
1. `npm run build` - Ensure TypeScript compiles without errors
2. `npm run lint` - Check for linting issues
3. `npm run test` - Verify all tests pass
4. Manual test: `/glm_quota` command in OpenCode

## Common Pitfalls
- ❌ Adding "Bearer " prefix to Authorization header
- ❌ Using single fabricated endpoint instead of three actual endpoints
- ❌ Missing URL encoding for query parameters
- ❌ Not handling missing credentials gracefully
- ❌ Forgetting to pad strings in ASCII output
- ❌ Assuming specific auth.json structure (use flexible discovery)
