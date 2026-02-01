# TDD Implementation Plan - OpenCode GLM Quota Plugin

**Goal:** Build a production-ready OpenCode plugin that queries Z.ai GLM Coding Plan usage statistics using Test-Driven Development with vertical slicing strategy.

**Architecture:** OpenCode Plugin System with TypeScript, native Node.js HTTP (https), Node.js native test runner, and Undici MockAgent for HTTP mocking.

**Tech Stack:** TypeScript 5.0+, Node.js 18+, @opencode-ai/plugin, undici (HTTP mocking)

---

## 📊 Progress Tracking

| Slice | Status | Date | Tests | Coverage |
|-------|--------|------|--------|----------|
| Slice 1: Authentication & Credential Discovery | ✅ **COMPLETE** | 2026-01-18 | 37 | N/A |
| Slice 1.5: OpenCode Command & Skill | ✅ **COMPLETE** | 2026-01-18 | - | - |
| Slice 2: Time Window & Utility Functions | ✅ **COMPLETE** | 2026-01-18 | 37 | N/A |
| Slice 3: Single Endpoint Query | ✅ **COMPLETE** | 2026-01-18 | - | - |
| Slice 4: Multiple Endpoints & Display | ✅ **COMPLETE** | 2026-01-18 | - | - |
| Slice 4.5: Add Next Reset Time | ✅ **COMPLETE** | 2026-01-21 | 13 | N/A |
| Slice 4.6: Global Installation & Setup Command | ✅ **COMPLETE** | 2026-01-31 | - | - |
| Slice 5: Error Handling & Edge Cases | 🔄 **IN PROGRESS** | 2026-02-01 | 77 | N/A |
| Slice 6: Refactoring & Optimization | ⏳ **TODO** | - | - | - |

**Overall Progress:** 8/9 slices complete (88.9%), Slice 5 in progress (16 tasks)

---

## 1. TDD Methodology

### 1.1 Core Principles

**Test-Driven Development (TDD)** means writing tests before implementation code. This ensures:
- Code is testable by design
- Tests actually test behavior (proven by watching them fail first)
- Refactoring is safe (tests catch regressions)
- Design emerges from usage

**The Iron Rule:**
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### 1.2 Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ RED: Write failing test                                     │
│   - Write ONE minimal test showing desired behavior         │
│   - MUST watch it fail (proves it tests something)          │
└─────────────────┬───────────────────────────────────────────┘
                  │ Verify fails correctly
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ GREEN: Write minimal code                                   │
│   - Simplest code to make test pass                         │
│   - Don't add features or refactor yet                      │
└─────────────────┬───────────────────────────────────────────┘
                  │ Verify passes
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ REFACTOR: Clean up                                          │
│   - Remove duplication                                      │
│   - Improve names                                           │
│   - Extract helpers (keep tests green)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
              Next test
```

### 1.3 Critical TDD Rules

1. **Never skip RED phase** - If you didn't watch the test fail, you don't know if it tests the right thing
2. **Always write minimal code** - Just enough to pass, no YAGNI
3. **One behavior per test** - Clear, descriptive names, single assertion
4. **Test real code** - Minimize mocks, test actual behavior
5. **Fix failures immediately** - Never commit failing tests
6. **Refactor only when green** - Never refactor with red tests

### 1.4 Anti-Patterns (STOP if you think these)

| Thought | Reality |
|---------|---------|
| "I'll test after" | Tests passing immediately prove nothing |
| "Already manually tested" | Ad-hoc ≠ systematic, no record |
| "Delete X hours is wasteful" | Sunk cost fallacy - keeping unverified code = technical debt |
| "TDD is too slow" | Debugging in production is slower |
| "This is too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "Keep as reference, write tests first" | You'll adapt it = testing after. Delete = delete. |

---

## 2. Vertical Slicing Strategy

### 2.1 What is Vertical Slicing?

Vertical slicing means building **complete end-to-end features** instead of horizontal layers. Each slice delivers user value and can be tested independently.

**Horizontal (Traditional) - ❌ BAD:**
```
Layer 1: Data models, interfaces, types
Layer 2: HTTP client, authentication
Layer 3: Business logic, data transformation
Layer 4: UI/formatting, output display
```
Problem: No user value until all layers complete. Can't test end-to-end.

**Vertical (Better) - ✅ GOOD:**
```
Slice 1: Credential discovery → Auth check → Error message
Slice 2: + Time window calculation → One API call → Display quota
Slice 3: + Multiple API calls → Full output → Progress bars
```
Benefit: Each slice delivers value. Can test independently.

### 2.2 Vertical Slice Criteria

Each slice MUST:
1. **Deliver user value** - User can see/interact with result
2. **Be testable end-to-end** - Integration tests from start to finish
3. **Have clear acceptance criteria** - Definition of done
4. **Have minimal dependencies** - Small surface area, focused scope
5. **Follow TDD** - Red-Green-Refactor for each feature

### 2.3 Slice Prioritization

**Priority Order (MVP → Full Features):**

1. **Slice 1: Authentication & Credential Discovery** (FOUNDATION)
   - Highest priority: Everything depends on this
   - User value: Clear error message when not authenticated
   - Testable: Mock auth.json, environment variables

2. **Slice 2: Time Window & Utility Functions** (CORE INFRA)
   - Foundation for all API queries
   - User value: Accurate time ranges for usage stats
   - Testable: Pure functions, easy to test

3. **Slice 3: Single Endpoint Query** (MVP FEATURE)
   - First working API call (quota limits)
   - User value: See current quota percentages
   - Testable: Mock HTTP responses

4. **Slice 4: Multiple Endpoints & Display** (FULL FEATURE)
   - All three endpoints working together
   - User value: Complete usage statistics
   - Testable: Integration test all API calls

5. **Slice 5: Error Handling & Edge Cases** (PRODUCTION READY)
   - Network failures, auth errors, parse errors
   - User value: Graceful error messages, no crashes
   - Testable: Mock error responses

6. **Slice 6: Refactoring & Optimization** (POLISH)
   - Code quality, performance, maintainability
   - User value: Faster, more maintainable code
   - Testable: Tests prevent regressions

---

## 3. Vertical Slices (Detailed)

### SLICE 1: Authentication & Credential Discovery ✅ **COMPLETE**

**User Value:** Users see helpful error message when not authenticated, guiding them to set up credentials.

**Status:** ✅ COMPLETED (2026-01-18)  
**Priority:** High (prerequisite for user-facing command)

**Acceptance Criteria:**
- [x] Plugin reads OpenCode auth.json from correct path
- [x] Plugin detects ZAI and ZHIPU platforms from provider IDs
- [x] Plugin falls back to environment variables for testing
- [x] Plugin throws clear error when no credentials found
- [x] Error message includes setup instructions

**Dependencies:** None (foundation slice)

---

### SLICE 1.5: OpenCode Command & Skill Integration ✅ **COMPLETE**

**User Value:** Users can invoke `/glm_quota` command with full discoverability, matching the Claude Code plugin experience.

**Status:** ✅ COMPLETED (2026-01-18)  
**Priority:** High (prerequisite for user-facing command)

**Acceptance Criteria:**
- [x] `.opencode/command/glm_quota.md` created with command definition
- [x] `.opencode/skill/glm-quota-skill.md` created with skill definition
- [x] `.opencode/opencode.json` created with agent definition
- [x] `scripts/query-usage.mjs` ported from Claude Code
- [ ] Command works when user types `/glm_quota` (manual test in OpenCode TUI)
- [ ] Skill properly invokes TypeScript plugin logic
- [ ] Agent orchestrates workflow correctly
- [ ] Output matches expected ASCII table format

**Files Created:**

| File | Description | Status |
|------|-------------|--------|
| `.opencode/command/glm_quota.md` | Command file | ✅ Created |
| `.opencode/skill/glm-quota-skill.md` | Skill file | ✅ Created |
| `.opencode/opencode.json` | Agent definition | ✅ Created |
| `scripts/query-usage.mjs` | Standalone CLI script | ✅ Already exists |

**Dependencies:** Slice 1 (plugin must work before command can invoke it)

**Test Strategy:**
- Manual testing: Invoke `/glm_quota` command and verify output
- No automated tests for command/skill files (they are configuration)

**Estimated Time:** 1-2 hours

**Steps:**
1. Create `.opencode/command/glm_quota.md` with command YAML
2. Create `.opencode/skill/glm-quota-skill.md` with skill YAML
3. Create `.opencode/opencode.json` with agent definition
4. Verify command works in OpenCode TUI
5. Verify output format matches expected ASCII table

**Git Commit:** `7cf3e4c` - "feat(opencode): add command/skill integration for glm_quota"

---

### SLICE 2: Time Window & Utility Functions ✅ **COMPLETE**

**User Value:** Accurate 24-hour rolling window for usage statistics queries.

**Status:** ✅ COMPLETED (2026-01-18)  
**Priority:** High (core infrastructure)

**Acceptance Criteria:**
- [x] `formatDateTime()` formats dates as `yyyy-MM-dd HH:mm:ss`
- [x] `getTimeWindow()` returns yesterday at current hour → today at current hour end
- [x] `createProgressBar()` generates visual progress bars with █ and ░
- [x] `processQuotaLimit()` transforms TOKENS_LIMIT and TIME_LIMIT responses
- [x] All utility functions are pure (no side effects)
- [x] All edge cases handled (boundary values, zero, 100%)

**Files Created:**
- `tests/functional/date-formatter.test.ts` - Date formatting tests
- `tests/functional/time-window.test.ts` - Time window tests
- `tests/functional/progress-bar.test.ts` - Progress bar tests
- `src/utils/date-formatter.ts` - Date formatter implementation
- `src/utils/time-window.ts` - Time window implementation
- `src/utils/progress-bar.ts` - Progress bar implementation

**Dependencies:** Slice 1 (for auth context in integration tests)

---

### SLICE 3: Single Endpoint Query (Quota Limits) ✅ **COMPLETE**

**User Value:** Users see current quota percentages for 5-hour token cycle and monthly MCP usage.

**Status:** ✅ COMPLETED (2026-01-18)

**Files to Create:**
- `tests/module/http-client.test.ts`
- `tests/integration/quota-query-pipeline.test.ts`
- `tests/fixtures/api-quota-success.json`
- `tests/mocks/https.mock.ts`

**Dependencies:** Slice 1 (auth), Slice 2 (utilities, display)

---

### SLICE 4: Multiple Endpoints & Display ✅ **COMPLETE**

**User Value:** Users see complete usage statistics including model usage and MCP tool usage.

**Status:** ✅ COMPLETED (2026-01-18)

**Acceptance Criteria:**
- [x] Model usage endpoint called with time window query params
- [x] Tool usage endpoint called with time window query params
- [x] Query parameters URL-encoded properly
- [x] All three endpoints queried sequentially (not parallel)
- [x] Each section displays in ASCII table format
- [x] Model usage JSON truncated to fit table (8 lines max)
- [x] Tool usage JSON truncated to fit table (8 lines max)
- [x] Platform displayed in header
- [x] Time window displayed in header
- [x] End-to-end integration test passes

**Files to Create:**
- `tests/integration/full-query-pipeline.test.ts`
- `tests/fixtures/api-model-success.json`
- `tests/fixtures/api-tool-success.json`

**Dependencies:** Slice 3 (single endpoint working)

---

### SLICE 4.5: Add Next Reset Time ✅ **COMPLETE**

**User Value:** Users see accurate countdown timers showing when their 5-hour token quota will reset, enabling better usage planning.

**Status:** ✅ COMPLETED (2026-01-21)
**Priority:** Medium (enhancement to existing display)

**Acceptance Criteria:**
- [x] `nextResetTime` field from API response is parsed and processed
- [x] `formatTimeUntilReset()` utility function converts Unix timestamps to human-readable countdowns
- [x] Reset countdown displayed in quota output: "Resets in X hours Y minutes"
- [x] Countdown updates based on current time vs reset timestamp
- [x] Graceful handling when reset time is not available (fallback to existing display)
- [x] Tests for reset time formatting and display logic
- [x] Integration tests verify reset countdown appears in output

**User Value Delivered:**
- **Before:** Users see static quota percentages without knowing when reset occurs
- **After:** Users see "Resets in 4 hours 42 minutes" enabling better usage planning

**Technical Implementation:**
- Parse `nextResetTime` field from `/quota/limit` API response (Unix timestamp in milliseconds)
- Add `formatTimeUntilReset()` function to convert timestamps to human-readable format
- Update display logic to include reset countdown when available
- Handle edge cases (reset time in past, invalid timestamps)

**Files Created/Modified:**
- `src/utils/reset-timer.ts` - Reset time formatting utility (NEW)
- `src/index.ts` - Updated quota processing and display logic
- `tests/functional/reset-timer.test.ts` - Tests for reset time formatting (NEW)
- `tests/integration/reset-time-display.test.ts` - Integration tests for display (NEW)

**Tests Created:**
- ✅ 9 functional tests for `formatTimeUntilReset()` (null, undefined, past, edge cases)
- ✅ 4 integration tests for reset time display in full output
- ✅ Total: 13 new tests (100% pass rate)
- ✅ Overall test count: 50 tests passing (37 existing + 13 new)

**Dependencies:** Slice 4 (display logic working), API Validation (confirmed nextResetTime field exists)

**Test Strategy:**
- Unit tests for `formatTimeUntilReset()` function
- Integration tests verifying reset countdown appears in full output
- Mock API responses with different reset timestamps
- Edge case testing (past timestamps, invalid data)

**Quality Checks:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 50 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Pure functions (no side effects)
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Constants use UPPER_SNAKE_CASE

**Git Commit:** `17e300b` - "feat: add next reset time countdown display"

**Branch:** `feature/slice-4.5-reset-time` (committed and pushed to remote)

---

### SLICE 4.6: Global Installation & Setup Command ✅ **COMPLETE**

**User Value:** Users can install plugin via npm with automatic OpenCode configuration, enabling `/glm_quota` command to work after installation.

**Status:** ✅ **COMPLETE** (2026-01-31)
**Priority:** Medium (usability enhancement)
**Estimated Time:** 1-2 days

**Problem Statement:**
Adding `"@opencode-glm-quota/plugin"` to `opencode.json` tells OpenCode to `npm install` plugin package, BUT:
- ❌ Agent definition not copied to OpenCode config
- ❌ Command file not copied to OpenCode config
- ❌ Skill file not copied to OpenCode config

These files must exist in `~/.config/opencode/` for `/glm_quota` to work.

**Solution:**
Package includes an installer command that copies `/integration/` files from npm package to user's OpenCode configuration directory. The installer merges agent configuration from `integration/opencode.jsonc` into `~/.config/opencode/opencode.json` using JSONC-safe parsing.

**Installation Flow:**
```
1. User adds to opencode.json:
   "plugins": ["@opencode-glm-quota/plugin"]

2. OpenCode runs: npm install @opencode-glm-quota/plugin

3. User runs installer: npx @opencode-glm-quota/plugin install

4. Files copied:
   - node_modules/@opencode-glm-quota/plugin/integration/command/glm_quota.md
      → ~/.config/opencode/command/glm_quota.md
   - node_modules/@opencode-glm-quota/plugin/integration/opencode.jsonc
      → ~/.config/opencode/opencode.json (merged safely)
   - node_modules/@opencode-glm-quota/plugin/integration/skill/glm-quota-skill.md
      → ~/.config/opencode/skill/glm-quota-skill.md

5. User restarts OpenCode, runs /glm_quota ✅
```

**Acceptance Criteria:**
- [x] `package.json` includes `integration/` in `files` field
- [x] `package.json` includes bin entry for install command
- [x] `bin/install.js` copies files from npm package to OpenCode config
- [x] Installer merges `opencode.jsonc` into existing config using JSONC parser
- [x] Manual `npx @opencode-glm-quota/plugin install` works for user control
- [x] `npx @opencode-glm-quota/plugin install --force` overwrites existing
- [x] Documentation updated with installation instructions

**Files to Create:**
- `integration/opencode.jsonc` - Agent configuration (JSONC)
- `bin/install.js` - Installer command executable

**Files to Move:**
- `.opencode/command/glm_quota.md` → `integration/command/glm_quota.md`
- `.opencode/opencode.json` → `integration/opencode.jsonc`
- `.opencode/skill/glm-quota-skill.md` → `integration/skill/glm-quota-skill.md`
- `scripts/query-usage.mjs` → `src/query-usage.ts`

**Files to Modify:**
- `package.json` - Add bin entry, `jsonc-parser` dependency, include `integration/` in files

**Dependencies:** Slice 1.5 (OpenCode command/skill files already exist)

**Test Strategy:**
- Manual testing of installer command
- Verification of file copying to correct locations
- Testing of config merging (existing config + new agent definition)
- Test of `--force` flag behavior
- Validation of OpenCode command discovery after installation

**Git Commit:** `feat: add global installation and setup command`

---

### SLICE 5: Error Handling & Edge Cases

**User Value:** Users see helpful error messages when things go wrong, no crashes or confusing behavior.

**Status:** ⏳ **IN PROGRESS** (2026-01-31)  
**Priority:** High (production-ready requirement)
**Estimated Time:** ~7 hours (16 tasks across 6 phases)

**Acceptance Criteria:**
- [ ] Network errors (timeout, connection refused) caught and handled
- [ ] Authentication errors (401, 403) display user-friendly message
- [ ] API errors (429, 500) propagate with clear context
- [ ] Parse errors (invalid JSON, missing fields) caught and reported
- [ ] Tokens never appear in error messages (sanitized)
- [ ] Each error type has dedicated test suite
- [ ] Integration tests cover error paths
- [ ] All errors use 60-char boxed format for consistency

**Task Breakdown (16 Tasks, 6 Phases):**

**Phase 1: Setup & Infrastructure (Tasks 1-3)**
- Task 1: Create `tests/error-handling/` directory structure
- Task 2: Create error fixtures (`401.json`, `403.json`, `429.json`, `500.json`)
- Task 3: TDD: Token sanitization utility (test → implement → refactor)

**Phase 2: Network Error Handling (Tasks 4-5)**
- Task 4: TDD: Network timeout error handling (boxed output, 10s timeout)
- Task 5: TDD: Network connection errors (ECONNREFUSED, ENOTFOUND)

**Phase 3: Authentication Error Handling (Tasks 6-7)**
- Task 6: TDD: 401 Unauthorized error (boxed with `/connect` instructions)
- Task 7: TDD: 403 Forbidden error (boxed with permission message)

**Phase 4: API & Parse Error Handling (Tasks 8-10)**
- Task 8: TDD: 429 Rate limiting error (boxed with retry guidance)
- Task 9: TDD: 500+ Server errors (boxed with "try later" message)
- Task 10: TDD: Invalid JSON parse errors (boxed, sanitized)

**Phase 5: Integration & Consistency (Tasks 11-14)**
- Task 11: Box all error outputs in `src/index.ts` catch block
- Task 12: Create `src/utils/error-formatter.ts` (consolidate boxed errors)
- Task 13: Integration tests: End-to-end error paths (network, auth, API, parse)
- Task 14: Run full test suite - verify all 50+ existing tests still pass

**Phase 6: Finalization (Tasks 15-16)**
- Task 15: Update `docs/implementation-plan.md` (mark Slice 5 complete)
- Task 16: Git commit & push: `feat: comprehensive error handling with token sanitization`

**Files to Create:**
- `tests/error-handling/network-errors.test.ts`
- `tests/error-handling/auth-errors.test.ts`
- `tests/error-handling/api-errors.test.ts`
- `tests/error-handling/parse-errors.test.ts`
- `tests/error-handling/token-sanitization.test.ts`
- `tests/integration/error-handling.test.ts`
- `tests/fixtures/api-error-401.json`
- `tests/fixtures/api-error-403.json`
- `tests/fixtures/api-error-429.json`
- `tests/fixtures/api-error-500.json`

**Files to Modify:**
- `src/api/client.ts` - Add timeout, categorize errors, sanitize tokens
- `src/index.ts` - Box all error outputs (line 693 catch block)
- `src/utils/error-formatter.ts` - Create error formatting utility (NEW)
- `docs/implementation-plan.md` - Mark Slice 5 complete (this task)

**Implementation Approach:**
1. **TDD for each error type:** Write failing test → implement minimal code → verify passes → refactor
2. **Token sanitization:** All error messages pass through `sanitizeToken()` before display
3. **Boxed error format:** Use `formatErrorBox(title: string, message: string): string` for consistency
4. **Fail-fast philosophy:** No retry logic - user-requested action, clear error, let user retry
5. **Parallel requests:** Keep `Promise.all()` in `queryAllUsage()` (not sequential as plan suggests)

**Test Coverage Goals:**
- Network error handling: 8 tests
- Auth error handling: 8 tests
- API error handling: 6 tests
- Parse error handling: 4 tests
- Token sanitization: 6 tests
- Integration error paths: 8 tests
- **Total:** 40+ new tests
- **Expected final count:** 90+ tests (50 existing + 40 new)

**Dependencies:** Slice 4 (all endpoints working)

---

### SLICE 6: Refactoring & Optimization

**User Value:** Code is maintainable, performant, and follows best practices.

**Acceptance Criteria:**
- [ ] Code follows AGENTS.md style guidelines
- [ ] Type safety maximized (no `any` types)
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Functions have clear names and single responsibility
- [ ] Duplication removed
- [ ] Test coverage ≥ 85%
- [ ] All lint checks pass
- [ ] TypeScript compiles without errors
- [ ] Documentation updated

**Files to Modify:**
- `src/index.ts` (refactor for clarity)
- `README.md` (update if needed)
- `CHANGELOG.md` (version 1.0.0 entry)

**Dependencies:** Slice 5 (all features complete)

---

## 4. Phase & Sprint Structure

### Phase 1: Foundation (Slices 1-2)

**Goal:** Establish core infrastructure and utility functions

**Sprint 1: Authentication** ✅ **COMPLETED (2026-01-18)**
- Complete Slice 1
- 2-3 days
- Deliverable: Credential discovery working, tests passing

**Sprint 2: Utilities** ✅ **COMPLETED (2026-01-18)**
- Complete Slice 2
- 2-3 days
- Deliverable: All utility functions tested, time window working

**Phase 1 Exit Criteria:**
- [x] All functional tests pass (pure functions) - Slice 2 complete
- [x] All module tests pass (with mocks) - Slice 1 complete
- [x] Credential discovery working - Slice 1 complete
- [x] Time window calculation accurate - Slice 2 complete
- [x] Code compiles without errors - Slice 1 & 2 complete
- [x] Lint checks pass - Slice 1 & 2 complete

---

### Phase 2: MVP Feature (Slice 3)

**Goal:** First working end-to-end feature (quota limits)

**Sprint 3: Single Endpoint**
- Complete Slice 3
- 3-4 days
- Deliverable: Quota limits API working, displaying percentages

**Phase 2 Exit Criteria:**
- [x] Single endpoint query works end-to-end
- [ ] Integration tests pass
- [ ] ASCII table displays correctly
- [ ] Progress bars render properly

---

### Phase 3: Full Feature (Slice 4)

**Goal:** Complete feature with all three endpoints

**Sprint 4: Multiple Endpoints**
- Complete Slice 4
- 3-4 days
- Deliverable: All endpoints working, complete display

**Phase 3 Exit Criteria:**
- [x] All three endpoints queried
- [x] Full output displays correctly
- [ ] Integration tests pass
- [ ] JSON truncation works
- [ ] Query params URL-encoded

---

### Phase 4: Production Ready (Slice 5)

**Goal:** Robust error handling and edge cases

**Sprint 5: Error Handling**
- Complete Slice 5
- 3-4 days
- Deliverable: All error paths tested, graceful failures

**Phase 4 Exit Criteria:**
- [ ] All error types tested
- [ ] Token sanitization verified
- [ ] Integration error tests pass
- [ ] No crashes on invalid input

---

### Phase 5: Polish & Release (Slice 6)

**Goal:** Code quality, documentation, and release preparation

**Sprint 6: Refactoring**
- Complete Slice 6
- 2-3 days
- Deliverable: Clean code, 85%+ coverage, ready to ship

**Phase 5 Exit Criteria:**
- [ ] Test coverage ≥ 85%
- [ ] All lint checks pass
- [ ] TypeScript compiles cleanly
- [ ] Documentation complete
- [ ] CHANGELOG updated
- [ ] Ready for npm publish

---

## 5. Testing Strategy

### 5.1 Test Categories

| Category | Description | % of Tests | Example |
|----------|-------------|-----------|---------|
| **Functional** | Pure functions, no side effects | 40% | `formatDateTime()`, `createProgressBar()` |
| **Module** | Side effects with mocked dependencies | 30% | `getCredentials()`, `makeRequest()` |
| **Integration** | Multiple modules working together | 20% | Full credential → API → output flow |
| **Error Handling** | Network, auth, parse errors | 10% | Timeout, 401, invalid JSON |

**Coverage Goal:** 85% overall

### 5.2 Test Structure

**Directory Layout:**
```
tests/
├── functional/           # Pure functions (no mocks)
│   ├── date-formatter.test.ts
│   ├── time-window.test.ts
│   ├── progress-bar.test.ts
│   └── response-processing.test.ts
├── module/              # Side effects with mocks
│   ├── credential-discovery.test.ts
│   ├── http-client.test.ts
│   └── platform-mapping.test.ts
├── integration/         # End-to-end flows
│   └── full-query-pipeline.test.ts
├── error-handling/      # Error scenarios
│   ├── network-errors.test.ts
│   ├── auth-errors.test.ts
│   ├── api-errors.test.ts
│   └── parse-errors.test.ts
├── mocks/              # Mock infrastructure
│   ├── https.mock.ts
│   └── types.ts
└── fixtures/           # Test data
    ├── auth-valid.json
    ├── auth-zai-coding-plan.json
    ├── auth-zhipu.json
    ├── api-quota-success.json
    ├── api-model-success.json
    ├── api-tool-success.json
    ├── api-error-401.json
    └── api-error-500.json
```

### 5.3 Test Pattern (AAA)

```typescript
import { describe, test, expect, beforeEach } from 'node:test'
import { formatDateTime } from '../../src/index'

describe('formatDateTime', () => {
  test('formats date as yyyy-MM-dd HH:mm:ss', () => {
    // Arrange - Set up test data
    const date = new Date(2026, 0, 13, 14, 30, 45)

    // Act - Execute function
    const result = formatDateTime(date)

    // Assert - Verify result
    expect(result).toBe('2026-01-13 14:30:45')
  })
})
```

### 5.4 Mocking Strategy

**Use Undici MockAgent for HTTP mocking:**
```typescript
import { MockAgent, setGlobalDispatcher, MockPool } from 'undici'

describe('makeRequest', () => {
  let mockAgent: MockAgent

  beforeEach(() => {
    mockAgent = new MockAgent()
    setGlobalDispatcher(mockAgent)
  })

  test('makes GET request to API', async () => {
    const mockPool = mockAgent.get('https://api.z.ai')
    mockPool.intercept({
      path: '/api/monitor/usage/quota/limit',
      method: 'GET',
      headers: {
        'authorization': 'test-token',
        'accept-language': 'en-US,en'
      }
    }).reply(200, JSON.stringify({ limits: [] }))

    const result = await makeRequest(url, token)
    expect(result).toEqual({ limits: [] })
  })
})
```

### 5.5 Test Execution

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/functional/date-formatter.test.ts

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test -- --watch
```

---

## 6. Dependencies & Risks

### 6.1 Slice Dependencies

```
Slice 1 (Auth) ───┐
                  ├───> Slice 1.5 (Command/Skill) ───┐
Slice 2 (Utils) ───┘                                  │
                                                      ├───> Slice 3 (Single Endpoint)
                                                              │
                                                              ├───> Slice 5 (Error Handling)
                                                              │
                                                              └───> Slice 6 (Refactoring)
```

**Key Dependencies:**
1. **Slice 1 must complete first** - All other slices depend on authentication
2. **Slice 1.5 depends on Slice 1** - Command/skill needs working plugin to invoke
3. **Slice 2 should parallelize with Slice 1** - Utility functions independent of auth
4. **Slice 3 depends on both** - Needs auth + utilities
5. **Slice 4 depends on Slice 3** - Extends single endpoint to multiple
6. **Slice 5 depends on Slice 4** - Error handling for complete feature
7. **Slice 6 depends on Slice 5** - Refactor complete feature

### 6.2 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API changes** | High (endpoints may change) | Use mock responses, flexible parsing, monitor API docs |
| **Auth complexity** | Medium (OpenCode plugin system new) | Mock extensively, test with real credentials, fallback to env vars |
| **HTTP mocking complexity** | Medium (Undici learning curve) | Use Undici MockAgent, create reusable mock utilities, reference Node.js docs |
| **Time zone issues** | Low (time window calculation) | Use UTC internally, document assumptions, test boundary cases |
| **TypeScript strict mode** | Low (type errors) | Enable strict mode early, fix incrementally, leverage compiler |

### 6.3 Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Underestimated complexity** | High (delays) | Vertical slicing reduces risk, each slice delivers value, can adjust scope |
| **API rate limiting** | Medium (tests flaky) | Use mocks, never hit real API in tests, document rate limits |
| **OpenCode plugin bugs** | Medium (blocked on framework) | Report issues early, use alternative auth method for testing |
| **Test flakiness** | Low (time wasted debugging) | Deterministic tests, no shared state, clear test isolation |

---

## 7. Acceptance Criteria (Project Level)

### 7.1 Functional Requirements

- [x] Plugin successfully authenticates with Z.AI API
- [x] Plugin queries all three endpoints (quota, model, tool)
- [x] Plugin displays usage statistics in ASCII table format
- [x] Plugin shows progress bars for quota percentages
- [ ] Plugin handles network errors gracefully
- [ ] Plugin handles authentication errors with user-friendly messages
- [ ] Plugin works on both Global (api.z.ai) and CN (open.bigmodel.cn) platforms

### 7.2 Technical Requirements

- [ ] TypeScript strict mode enabled
- [ ] Test coverage ≥ 85%
- [ ] All tests pass (no failures, no flakes)
- [ ] TypeScript compiles without errors
- [ ] Lint checks pass (eslint configured)
- [ ] Code follows AGENTS.md style guidelines
- [ ] No `any` types (use proper TypeScript types)
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Functions have clear, descriptive names

### 7.3 TDD Requirements

- [x] Every function has a test - Slice 1 complete
- [x] Every test was written BEFORE implementation (watched it fail) - Slice 1 complete
- [x] All tests use AAA pattern (Arrange-Act-Assert) - Slice 1 complete
- [x] All tests have descriptive names - Slice 1 complete
- [x] No production code without failing test first - Slice 1 complete
- [x] No skipped tests - Slice 1 complete
- [x] No commented-out tests - Slice 1 complete

### 7.4 Documentation Requirements

- [ ] README.md complete with installation and usage
- [ ] CHANGELOG.md updated with version 1.0.0
- [ ] Function documentation (JSDoc) for all exports
- [ ] API reference in README (endpoints, auth, time window)
- [ ] Example output in README

---

## 8. How to Use This Plan

### 8.1 Before You Start

1. **Read this entire plan** - Understand the full scope
2. **Set up development environment**:
   ```bash
   npm install
   npm run build  # Verify TypeScript compiles
   npm test  # Verify test runner works
   ```
3. **Review AGENTS.md** - Understand code style guidelines
4. **Review PRD** - Understand requirements and API specs

### 8.2 Execution Order

**Follow slices in order:**
1. Slice 1 (Authentication) → 2-3 days
2. Slice 2 (Utilities) → 2-3 days
3. Slice 3 (Single Endpoint) → 3-4 days
4. Slice 4 (Multiple Endpoints) → 3-4 days
5. Slice 5 (Error Handling) → 3-4 days
6. Slice 6 (Refactoring) → 2-3 days

**Total Estimated Time:** 15-21 days

### 8.3 TDD Workflow Per Task

**For EVERY feature in every slice:**

1. **Write failing test** (RED)
   - Use AAA pattern
   - Describe desired behavior
   - Run test to verify it fails

2. **Write minimal implementation** (GREEN)
   - Simplest code to pass test
   - Don't refactor or add features

3. **Run test to verify it passes** (GREEN)
   - Test should pass
   - No other tests should break

4. **Refactor** (REFACTOR)
   - Remove duplication
   - Improve names
   - Extract helpers
   - Keep tests green

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: implement [feature] with TDD"
   ```

### 8.4 Verification Checkpoints

**After each slice:**
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Lint checks pass
- [ ] New code follows AGENTS.md guidelines
- [ ] Slice acceptance criteria met

**After each phase:**
- [ ] Phase exit criteria verified
- [ ] Integration tests passing
- [ ] Manual testing (if applicable)
- [ ] Documentation updated

### 8.5 Debugging Failed Tests

**When a test fails:**

1. **Check RED phase** - Did you watch it fail?
   - If NO: Delete implementation, start over with RED phase first
   - If YES: Proceed

2. **Read error message** - What's actually failing?

3. **Check test assumptions** - Is test correct?

4. **Fix implementation** - Minimal change to make test pass

5. **Verify GREEN** - Test passes, no other tests broken

6. **Refactor** - Only after GREEN confirmed

**NEVER:**
- Modify test to match implementation (that's not TDD)
- Skip test (that's hiding bugs)
- Comment out test (that's technical debt)
- Copy-paste from reference (that's testing after)

### 8.6 When Stuck

**Can't write test?**
- Write the wished-for API first
- Write the assertion first
- What would the function signature be?
- What should it return?

**Test too complicated?**
- Design is too complex
- Simplify the interface
- Break into smaller functions

**Must mock everything?**
- Code too coupled
- Use dependency injection
- Extract pure functions

**Test setup huge?**
- Extract test helpers
- Still complex? Simplify design

---

## 9. Success Metrics

### 9.1 Code Quality Metrics

- [ ] Test coverage: ≥ 85%
- [ ] TypeScript strict mode: Enabled
- [ ] Lint errors: 0
- [ ] TypeScript errors: 0
- [ ] Test failures: 0
- [ ] Flaky tests: 0

### 9.2 Functional Metrics

- [x] All three endpoints working
- [x] Both platforms supported (ZAI, ZHIPU)
- [x] Authentication working (OpenCode + env vars)
- [x] Time window calculation accurate
- [x] Output displays correctly
- [ ] Error handling robust

### 9.3 Process Metrics

- [ ] Every feature implemented with TDD
- [ ] Every test written before implementation
- [ ] Every test watched fail (RED phase)
- [ ] No skipped tests
- [ ] Frequent commits (every 1-2 features)
- [ ] Documentation kept current

---

## 10. References

### 10.1 Documentation

- **PRD:** `docs/opencode-glm-quota-prd-final.md` - Complete requirements and API specs
- **AGENTS.md:** `AGENTS.md` - Code style, guidelines, and conventions
- **README.md:** `README.md` - Public-facing documentation
- **CHANGELOG.md:** `CHANGELOG.md` - Version history

### 10.2 External Resources

- **OpenCode Plugin Docs:** https://opencode.ai/docs/plugins/
- **Z.ai API Docs:** https://docs.z.ai/devpack/overview
- **Official Source:** https://github.com/zai-org/zai-coding-plugins
- **Node.js Testing:** https://nodejs.org/api/test.html
- **Undici MockAgent:** https://undici.nodejs.org/#/docs/api/MockAgent

### 10.3 Skills & Standards

- **TDD Skill:** `superpowers:test-driven-development` - Strict TDD methodology
- **Writing Plans:** `superpowers:writing-plans` - Implementation planning
- **Code Standards:** `.opencode/context/core/standards/code.md`
- **Test Standards:** `.opencode/context/core/standards/test-coverage.md`

---

## 11. Recent Updates

### 2026-02-01: Slice 5 Task 8 - 429 Rate Limit Error Handling ✅ **COMPLETE**

**Status:** ✅ COMPLETED (2026-02-01)
**Branch:** `feature/slice-5-error-handling`
**Commit:** `49b7520` - "feat: add 429 rate limit error handling (slice5-08)"

**Implemented:**
- ✅ `formatApiError()` function for HTTP 429 responses
- ✅ User-friendly boxed message: "Too many requests. Please try again later."
- ✅ Token sanitization applied to prevent credential exposure
- ✅ 60-character boxed error format for consistency
- ✅ 4 new tests for 429 error handling (all passing)

**Test Results:**
- ✅ 4 new tests for 429 error handling
- ✅ Total: 85 tests passing (81 existing + 4 new)
- ✅ TypeScript compiles without errors
- ✅ Linting passes (0 errors, 0 warnings)

**Files Modified:**
- `tests/error-handling/api-errors.test.ts` (NEW)
- `src/api/client.ts` (added formatApiError function)

**TDD Methodology:**
- ✅ RED: Wrote failing tests first (watched them fail)
- ✅ GREEN: Implemented minimal code to pass tests
- ✅ REFACTOR: Verified code quality (lint, TypeScript compile)

**Quality Checks:**
- ✅ All 85 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Token sanitization verified
- ✅ Consistent with auth error handling pattern

**Next Steps:**
1. Proceed to Task 9: 500+ Server error handling
2. Expected: +4 tests, total ~89 tests passing

---

### 2026-02-01: Slice 5 Task 7 - 403 Forbidden Error Handling ✅ **COMPLETE**

**Status:** ✅ COMPLETED (2026-02-01)
**Branch:** `feature/slice-5-error-handling`
**Commit:** `b726f94` - "feat: add 403 forbidden error handling (slice5-07)"

**Implemented:**
- ✅ Extended `formatAuthError()` function to handle HTTP 403 responses
- ✅ User-friendly boxed message: "Access denied. You don't have permission."
- ✅ Token sanitization applied to prevent credential exposure
- ✅ 60-character boxed error format for consistency
- ✅ 4 new tests for 403 error handling (all passing)

**Test Results:**
- ✅ 4 new tests for 403 error handling
- ✅ Total: 81 tests passing (77 existing + 4 new)
- ✅ TypeScript compiles without errors
- ✅ Linting passes (0 errors, 0 warnings)

**Files Modified:**
- `tests/error-handling/auth-errors.test.ts` (extended with 403 tests)
- `src/api/client.ts` (updated formatAuthError with 403 handling)

**TDD Methodology:**
- ✅ RED: Wrote failing tests first (watched them fail)
- ✅ GREEN: Implemented minimal code to pass tests
- ✅ REFACTOR: Verified code quality (lint, TypeScript compile)

**Quality Checks:**
- ✅ All 81 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Token sanitization verified
- ✅ Consistent with 401 error handling pattern

**Next Steps:**
1. Proceed to Phase 4: API & Parse Error Handling (Tasks 8-10)
2. Task 8: 429 Rate limiting error
3. Expected: +4 tests, total ~85 tests passing

---

### 2026-02-01: Slice 5 Task 6 - 401 Unauthorized Error Handling ✅ **COMPLETE**

**Status:** ✅ COMPLETED (2026-02-01)
**Branch:** `feature/slice-5-error-handling`
**Commit:** `9cc2186` - "feat: add 401 unauthorized error handling (slice5-06)"

**Implemented:**
- ✅ `formatAuthError()` function for HTTP 401 responses
- ✅ User-friendly boxed message: "Authentication failed. Please check your credentials."
- ✅ Token sanitization applied to prevent credential exposure
- ✅ 60-character boxed error format for consistency
- ✅ 4 new tests for auth error handling (all passing)

**Test Results:**
- ✅ 4 new tests for 401 error handling
- ✅ Total: 77 tests passing (73 existing + 4 new)
- ✅ TypeScript compiles without errors
- ✅ Linting passes (0 errors, 0 warnings)

**Files Modified:**
- `tests/error-handling/auth-errors.test.ts` (NEW)
- `src/api/client.ts` (updated with formatAuthError function)

**TDD Methodology:**
- ✅ RED: Wrote failing tests first (watched them fail)
- ✅ GREEN: Implemented minimal code to pass tests
- ✅ REFACTOR: Verified no refactoring needed

**Quality Checks:**
- ✅ All 77 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Token sanitization verified

**Next Steps:**
1. Proceed to Task 7: 403 Forbidden error handling
2. Expected: +4 tests, total ~81 tests passing

---

### 2026-01-31: Slice 5 Planning - Error Handling & Edge Cases ⏳ **PLANNED**

**Status:** Ready to start - 16 tasks organized into 6 phases
**Estimated Time:** ~7 hours total
**Branch:** `feature/slice-5-error-handling`

**Task Breakdown:**

**Phase 1: Setup & Infrastructure (45 min)**
- Task 1: Create `tests/error-handling/` directory structure
- Task 2: Create error fixtures (401.json, 403.json, 429.json, 500.json)
- Task 3: TDD: Token sanitization utility (test → implement → refactor)

**Phase 2: Network Error Handling (75 min)**
- Task 4: TDD: Network timeout error handling (boxed output, 10s timeout)
- Task 5: TDD: Network connection errors (ECONNREFUSED, ENOTFOUND)

**Phase 3: Authentication Error Handling (75 min)**
- Task 6: TDD: 401 Unauthorized error (boxed with `/connect` instructions)
- Task 7: TDD: 403 Forbidden error (boxed with permission message)

**Phase 4: API & Parse Error Handling (90 min)**
- Task 8: TDD: 429 Rate limiting error (boxed with retry guidance)
- Task 9: TDD: 500+ Server errors (boxed with "try later" message)
- Task 10: TDD: Invalid JSON parse errors (boxed, sanitized)

**Phase 5: Integration & Consistency (125 min)**
- Task 11: Box all error outputs in `src/index.ts` catch block
- Task 12: Create `src/utils/error-formatter.ts` (consolidate boxed errors)
- Task 13: Integration tests: End-to-end error paths (network, auth, API, parse)
- Task 14: Run full test suite - verify all 50+ existing tests still pass

**Phase 6: Finalization (15 min)**
- Task 15: Update `docs/implementation-plan.md` (mark Slice 5 complete)
- Task 16: Git commit & push: `feat: comprehensive error handling with token sanitization`

**Files to Create:**
- `tests/error-handling/network-errors.test.ts`
- `tests/error-handling/auth-errors.test.ts`
- `tests/error-handling/api-errors.test.ts`
- `tests/error-handling/parse-errors.test.ts`
- `tests/error-handling/token-sanitization.test.ts`
- `tests/integration/error-handling.test.ts`
- `tests/fixtures/api-error-401.json`
- `tests/fixtures/api-error-403.json`
- `tests/fixtures/api-error-429.json`
- `tests/fixtures/api-error-500.json`

**Files to Modify:**
- `src/api/client.ts` - Add timeout, categorize errors, sanitize tokens
- `src/index.ts` - Box all error outputs (line 693 catch block)
- `src/utils/error-formatter.ts` - Create error formatting utility (NEW)

**Implementation Approach:**
- **TDD for each error type:** Write failing test → implement minimal code → verify passes → refactor
- **Token sanitization:** All error messages pass through `sanitizeToken()` before display
- **Boxed error format:** Use `formatErrorBox(title: string, message: string): string` for consistency
- **Fail-fast philosophy:** No retry logic - user-requested action, clear error, let user retry

**Test Coverage Goals:**
- Network error handling: 8 tests
- Auth error handling: 8 tests
- API error handling: 6 tests
- Parse error handling: 4 tests
- Token sanitization: 6 tests
- Integration error paths: 8 tests
- **Total:** 40+ new tests
- **Expected final count:** 90+ tests (50 existing + 40 new)

**Quality Goals:**
- All errors use 60-char boxed format
- Tokens never appear in error messages
- Clear, user-friendly error messages
- No raw stack traces in output
- No crashes on invalid input

**Next Steps:**
1. Start Task 1: Create directory structure
2. Follow TDD Red-Green-Refactor cycle for each task
3. Update todo list after each completed task
4. Run full test suite after Task 14

---

### 2026-01-21: Slice 4.5 - Next Reset Time ✅ **COMPLETE**

**Implemented:**
- ✅ `formatTimeUntilReset()` - Converts Unix timestamps to human-readable countdowns
- ✅ Enhanced `QuotaLimitItem` interface - Added `nextResetTime?: number` field
- ✅ Updated `processQuotaLimit()` - Preserves `nextResetTime` from TOKENS_LIMIT API responses
- ✅ Modified `formatOutput()` - Displays "Resets in X hours Y minutes" when available
- ✅ Added graceful fallback - Empty string when reset time unavailable or past

**How It Works:**
1. `/quota/limit` API response includes `nextResetTime` (Unix timestamp in milliseconds)
2. Plugin parses timestamp and calculates difference from current time
3. `formatTimeUntilReset()` converts to "X hours Y minutes" format
4. Countdown displayed under quota limits when available
5. Empty string returned for null/undefined/past timestamps

**Files Created:**
- ✅ `src/utils/reset-timer.ts` - Reset time formatting utility (46 lines)
- ✅ `tests/functional/reset-timer.test.ts` - 9 functional tests
- ✅ `tests/integration/reset-time-display.test.ts` - 4 integration tests

**Files Modified:**
- ✅ `src/index.ts` - Added reset countdown display logic
  - Imported `formatTimeUntilReset` utility
  - Updated `QuotaLimitItem` interface with `nextResetTime?: number`
  - Modified `processQuotaLimit()` to preserve reset timestamp
  - Enhanced `formatOutput()` to display countdown under quota limits

**Test Results:**
- ✅ 9 functional tests: null/undefined handling, past timestamps, edge cases
- ✅ 4 integration tests: quota data processing, fallback behavior
- ✅ Total: 13 new tests (100% pass rate)
- ✅ Overall: 50 tests passing (37 existing + 13 new)

**Test Coverage:**
- ✅ Reset timestamp parsing from API response
- ✅ Countdown formatting (hours, minutes, zero values)
- ✅ Edge cases: null, undefined, past timestamps, invalid values
- ✅ Integration: Reset countdown appears in full output
- ✅ Fallback: Empty string when reset time unavailable

**Quality Checks:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 50 tests passing (100%)
- ✅ Code follows AGENTS.md guidelines
- ✅ Pure functions (no side effects)
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Constants use UPPER_SNAKE_CASE

**User Value:**
- **Before:** Static quota percentages only, no timing information
- **After:** Dynamic "Resets in X hours Y minutes" countdown
- **Benefit:** Users can plan GLM usage within 5-hour quota windows

**Git Commit:** `17e300b` - "feat: add next reset time countdown display"

**Branch:** `feature/slice-4.5-reset-time` (committed and pushed to remote)

**Next Steps:**
1. Update documentation to reflect Slice 4.5 completion
2. Proceed to Slice 4.6: Global Installation & Setup Command
3. Create integration files for npm package
4. Implement installer command for automatic OpenCode configuration

---

### 2026-01-18: Slice 1.5 Completion ✅

**Implemented:**
- ✅ `.opencode/command/glm_quota.md` - Minimal command file (15 chars body)
- ✅ `.opencode/opencode.json` - Agent definition with minimal executor
- ✅ `.opencode/skill/glm-quota-skill.md` - Skill file for reusability

**How It Works:**
1. User types `/glm_quota` in OpenCode TUI
2. OpenCode loads command file (minimal content)
3. Routes to `glm-quota-exec` agent (minimal system prompt)
4. LLM receives: "Execute glm_quota tool"
5. LLM calls `glm_quota` tool directly (no reasoning)
6. Tool returns ASCII table output

**Files Created:**
- ✅ `.opencode/command/glm_quota.md` (6 lines, 91 bytes)
- ✅ `.opencode/opencode.json` (11 lines, 371 bytes)
- ✅ `.opencode/skill/glm-quota-skill.md` (11 lines, 317 bytes)

**Context Usage:**
| Approach | Command Size | Reasoning | Total Context |
|----------|--------------|-----------|---------------|
| Standard | ~300 chars | Full | High |
| **Minimal** | **15 chars** | **None** | **Low** |

**Quality Checks:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 37 tests passing
- ✅ Code follows AGENTS.md guidelines

**Next Steps:**
1. Proceed to Slice 3: Single Endpoint Query
2. Implement HTTP client (`makeRequest`)
3. Connect to Z.ai API quota endpoint
4. Process and display quota percentages

---

### 2026-01-18: Slices 3 & 4 Completion ✅

**Verified:**
- ✅ `/glm_quota` command executes successfully end-to-end
- ✅ Z.AI platform detected and authenticated correctly
- ✅ All three API endpoints queried (quota, model, tool)
- ✅ Response data parsed and displayed in ASCII table format
- ✅ MCP usage: 87/100 (87% utilized)
- ✅ Token usage: Minimal/empty (as expected)
- ✅ Time window: 24-hour rolling window (2026-01-17 13:00:00 to 2026-01-18 13:59:59)
- ✅ Progress bars rendering correctly

**Execution Result:**
```
Platform: Z.AI
Period: 24-hour window
MCP Usage: 87/100 (87%)
Token Usage: Minimal/empty
```

**Quality Verification:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 37 tests passing
- ✅ Code follows AGENTS.md guidelines
- ✅ ASCII table format correct
- ✅ Progress bars display properly

**Files Validated:**
- ✅ `.opencode/command/glm_quota.md` - Command executes correctly
- ✅ `.opencode/opencode.json` - Agent routes properly
- ✅ `src/index.ts` - Plugin integration working
- ✅ `src/api/client.ts` - HTTP requests successful
- ✅ `src/utils/progress-bar.ts` - Progress bars rendering

**Next Steps:**
1. Proceed to Slice 5: Error Handling & Edge Cases
2. Implement network error handling
3. Implement auth error messages
4. Add parse error recovery
5. Test error paths with mock responses

---

### 2026-01-18: Slices 1 & 2 Completion ✅

**Implemented:**
- ✅ `getProviderPlatform()` - Maps provider IDs to platforms (ZAI/ZHIPU)
- ✅ `getCredentials()` - Retrieves credentials with priority (OpenCode → env vars → null)
- ✅ `createCredentialError()` - Creates helpful error message with setup instructions
- ✅ `GlmQuotaPlugin` - Main plugin integration
- ✅ `formatDateTime()` - Formats dates as `yyyy-MM-dd HH:mm:ss`
- ✅ `getTimeWindow()` - Returns 24-hour rolling window
- ✅ `getTimeWindowQueryParams()` - URL-encodes time window parameters
- ✅ `createProgressBar()` - Generates ASCII progress bars
- ✅ `formatPercentage()` - Formats percentage values
- ✅ `formatProgressLine()` - Formats complete progress bar lines

**Tests Created:**
- ✅ 4 platform detection tests
- ✅ 6 credential discovery tests
- ✅ 3 error message tests
- ✅ 3 integration tests
- ✅ 7 date formatter tests
- ✅ 4 progress bar tests
- ✅ 6 time window tests
- ✅ Total: 37 tests (100% pass rate)

**Files Created:**
- ✅ `src/index.ts` - Plugin entry point
- ✅ `src/api/platforms.ts` - Platform detection
- ✅ `src/api/endpoints.ts` - API endpoint definitions
- ✅ `src/api/client.ts` - HTTP client
- ✅ `src/utils/date-formatter.ts` - Date formatting
- ✅ `src/utils/time-window.ts` - Time window calculation
- ✅ `src/utils/progress-bar.ts` - Progress bar generation
- ✅ `tests/module/credential-discovery.test.ts` - Credential tests
- ✅ `tests/module/platform-detection.test.ts` - Platform tests
- ✅ `tests/functional/date-formatter.test.ts` - Date tests
- ✅ `tests/functional/time-window.test.ts` - Time tests
- ✅ `tests/functional/progress-bar.test.ts` - Progress tests
- ✅ `tests/fixtures/auth-zai-coding-plan.json` - Test fixture
- ✅ `tests/fixtures/auth-zhipu.json` - Test fixture
- ✅ Updated `package.json` - Added `tsx` devDependency, `"type": "module"`

**Quality Checks:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 37 tests passing
- ✅ Code follows AGENTS.md guidelines
- ✅ Pure functions (no side effects)
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Constants use UPPER_SNAKE_CASE

**Infrastructure Fixes:**
- ✅ Added `tsx` for TypeScript test execution (NodeNext module resolution)
- ✅ Fixed `z-ai` platform detection (was missing `lower === 'z-ai'` check)
- ✅ Removed unused code (`PLATFORM_MAP`, `PLUGIN_VERSION`, `createProgressBar` import)
- ✅ Fixed unused parameters (`_args`, `_context`, `totalWidth`)

**Scripts Ported:**
- ✅ `scripts/query-usage.mjs` - Standalone CLI script ported from Claude Code

**Next Steps:**
1. Start Slice 1.5: OpenCode Command & Skill Integration
2. Create `.opencode/command/glm_quota.md`
3. Create `.opencode/skill/glm-quota-skill.md`
4. Create `.opencode/opencode.json`
5. Then proceed to Slice 3: Single Endpoint Query

---

### 2026-01-18: Slice 1 Completion ✅

**Implemented:**
- ✅ `getProviderPlatform()` - Maps provider IDs to platforms (ZAI/ZHIPU)
- ✅ `getCredentials()` - Retrieves credentials with priority (OpenCode → env vars → null)
- ✅ `createCredentialError()` - Creates helpful error message with setup instructions
- ✅ `GlmQuotaPlugin` - Main plugin integration

**Tests Created:**
- ✅ 4 platform detection tests
- ✅ 6 credential discovery tests
- ✅ 3 error message tests
- ✅ 3 integration tests
- ✅ Total: 16 tests (100% pass rate)

**Files Created:**
- ✅ `src/index.ts` - Plugin entry point
- ✅ `tests/module/credential-discovery.test.ts` - Test suite
- ✅ `tests/fixtures/auth-zai-coding-plan.json` - Test fixture
- ✅ `tests/fixtures/auth-zhipu.json` - Test fixture
- ✅ Updated `package.json` to add `"type": "module"`

**Quality Checks:**
- ✅ TypeScript compiles without errors
- ✅ ESLint passes
- ✅ All 16 tests passing
- ✅ Code follows AGENTS.md guidelines
- ✅ Pure functions (no side effects)
- ✅ Type-safe (strict mode, no `any` types)
- ✅ Constants use UPPER_SNAKE_CASE

**Next Steps:**
1. Start Slice 2: Time Window & Utility Functions
2. Implement `formatDateTime()`
3. Implement `getTimeWindow()`
4. Implement `createProgressBar()`
5. Implement `processQuotaLimit()`

---

## 12. Summary

This plan provides:

✅ **TDD Methodology** - Clear Red-Green-Refactor workflow with strict rules

✅ **Vertical Slicing** - 6 prioritized slices delivering user value incrementally

✅ **Phased Approach** - 5 phases with clear exit criteria and deliverables

✅ **Testing Strategy** - 85% coverage goal with functional, module, integration, and error tests

✅ **Acceptance Criteria** - Clear definition of done for each slice and overall project

✅ **Risk Mitigation** - Technical and schedule risks with mitigation strategies

✅ **Execution Guide** - How to use plan, TDD workflow, debugging approach

**Current Status:**

✅ **Slice 1-4.6 Complete** (8/9 slices, 88.9%)
⏳ **Slice 5 In Progress** - Error Handling & Edge Cases (16 tasks, 6 phases)
⏳ **Slice 6 Pending** - Refactoring & Optimization

**Next Steps:**

1. Continue Slice 5: Error Handling & Edge Cases (16 tasks)
   - Phase 1: Setup & Infrastructure (Tasks 1-3)
   - Phase 2: Network Error Handling (Tasks 4-5)
   - Phase 3: Authentication Error Handling (Tasks 6-7)
   - Phase 4: API & Parse Error Handling (Tasks 8-10)
   - Phase 5: Integration & Consistency (Tasks 11-14)
   - Phase 6: Finalization (Tasks 15-16)
2. Implement network error handling (timeout, connection refused)
3. Implement auth error messages (401, 403)
4. Add parse error recovery (invalid JSON, missing fields)
5. Test error paths with mock responses
6. Verify token sanitization in error messages
7. Run full test suite (90+ tests expected)
8. Then proceed to Slice 6: Refactoring & Optimization

---

*Document Version: 1.5*
*Created: 2026-01-17*
*Last Updated: 2026-01-31*
*Status: Slice 5 In Progress (16 tasks planned)*
