# TDD Implementation Plan - OpenCode GLM Quota Plugin

**Goal:** Build a production-ready OpenCode plugin that queries Z.ai GLM Coding Plan usage statistics using Test-Driven Development with vertical slicing strategy.

**Architecture:** OpenCode Plugin System with TypeScript, native Node.js HTTP (https), Node.js native test runner, and Undici MockAgent for HTTP mocking.

**Tech Stack:** TypeScript 5.0+, Node.js 18+, @opencode-ai/plugin, undici (HTTP mocking)

---

## 📊 Progress Tracking

| Slice | Status | Date | Tests | Coverage |
|-------|--------|------|--------|----------|
| Slice 1: Authentication & Credential Discovery | ✅ **COMPLETED** | 2026-01-18 | 16/16 | 100% |
| Slice 1.5: OpenCode Command & Skill | ⏳ **TODO** | - | - | - |
| Slice 2: Time Window & Utility Functions | ⏳ **TODO** | - | - | - |
| Slice 3: Single Endpoint Query | ⏳ **TODO** | - | - | - |
| Slice 4: Multiple Endpoints & Display | ⏳ **TODO** | - | - | - |
| Slice 5: Error Handling & Edge Cases | ⏳ **TODO** | - | - | - |
| Slice 6: Refactoring & Optimization | ⏳ **TODO** | - | - | - |

**Overall Progress:** 1.5/7 slices complete (21.4%)

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
│ RED: Write failing test                                   │
│   - Write ONE minimal test showing desired behavior         │
│   - MUST watch it fail (proves it tests something)        │
└─────────────────┬───────────────────────────────────────────┘
                  │ Verify fails correctly
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ GREEN: Write minimal code                                  │
│   - Simplest code to make test pass                       │
│   - Don't add features or refactor yet                    │
└─────────────────┬───────────────────────────────────────────┘
                  │ Verify passes
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ REFACTOR: Clean up                                       │
│   - Remove duplication                                    │
│   - Improve names                                         │
│   - Extract helpers (keep tests green)                    │
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

### SLICE 1: Authentication & Credential Discovery ✅ **COMPLETED**

**User Value:** Users see helpful error message when not authenticated, guiding them to set up credentials.

**Status:** ✅ Completed on 2026-01-18
**Tests:** 16/16 passing
**Coverage:** 100% of credential discovery logic

**Acceptance Criteria:**
- [x] Plugin reads OpenCode auth.json from correct path
- [x] Plugin detects ZAI and ZHIPU platforms from provider IDs
- [x] Plugin falls back to environment variables for testing
- [x] Plugin throws clear error when no credentials found
- [x] Error message includes setup instructions

**Files Created:** ✅
- `src/index.ts` - Plugin entry point with credential discovery
- `tests/module/credential-discovery.test.ts` - Complete test suite (16 tests)
- `tests/fixtures/auth-zai-coding-plan.json` - Test fixture for ZAI auth
- `tests/fixtures/auth-zhipu.json` - Test fixture for Zhipu auth

**Dependencies:** None (foundation slice)

---

### SLICE 1.5: OpenCode Command & Skill Integration ⏳ **NEW**

**User Value:** Users can invoke `/glm_quota` command with full discoverability, matching the Claude Code plugin experience.

**Status:** ⏳ TODO  
**Priority:** High (prerequisite for user-facing command)

**Acceptance Criteria:**
- [ ] `.opencode/command/glm_quota.md` created with command definition
- [ ] `.opencode/skill/glm-quota-skill.md` created with skill definition
- [ ] `.opencode/opencode.json` created with agent definition
- [ ] `scripts/query-usage.mjs` ported from Claude Code
- [ ] Command works when user types `/glm_quota`
- [ ] Skill properly invokes TypeScript plugin logic
- [ ] Agent orchestrates workflow correctly
- [ ] Output matches expected ASCII table format

**Files to Create:**

| File | Description | Source |
|------|-------------|--------|
| `.opencode/command/glm_quota.md` | Command file | New |
| `.opencode/skill/glm-quota-skill.md` | Skill file | Based on Claude Code pattern |
| `.opencode/opencode.json` | Agent definition | New |
| `scripts/query-usage.mjs` | Standalone CLI script | Port from zai-coding-plugins |

**Dependencies:** Slice 1 (plugin must work before command can invoke it)

**Test Strategy:**
- Manual testing: Invoke `/glm_quota` command and verify output
- No automated tests for command/skill files (they are configuration)

**Estimated Time:** 1-2 hours

**Steps:**
1. Create `.opencode/command/glm_quota.md` with command YAML
2. Create `.opencode/skill/glm-quota-skill.md` with skill YAML
3. Create `.opencode/opencode.json` with agent definition
4. Port `scripts/query-usage.mjs` from Claude Code
5. Verify command works in OpenCode TUI
6. Verify output format matches expected ASCII table

---

### SLICE 2: Time Window & Utility Functions

**User Value:** Accurate 24-hour rolling window for usage statistics queries.

**Acceptance Criteria:**
- [ ] `formatDateTime()` formats dates as `yyyy-MM-dd HH:mm:ss`
- [ ] `getTimeWindow()` returns yesterday at current hour → today at current hour end
- [ ] `createProgressBar()` generates visual progress bars with █ and ░
- [ ] `processQuotaLimit()` transforms TOKENS_LIMIT and TIME_LIMIT responses
- [ ] All utility functions are pure (no side effects)
- [ ] All edge cases handled (boundary values, zero, 100%)

**Files to Create:**
- `tests/functional/date-formatter.test.ts`
- `tests/functional/time-window.test.ts`
- `tests/functional/progress-bar.test.ts`
- `tests/functional/response-processing.test.ts`
- `tests/mocks/types.ts`

**Dependencies:** Slice 1 (for auth context in integration tests)

---

### SLICE 3: Single Endpoint Query (Quota Limits)

**User Value:** Users see current quota percentages for 5-hour token cycle and monthly MCP usage.

**Acceptance Criteria:**
- [ ] `makeRequest()` makes HTTPS request to Z.ai API
- [ ] Request uses correct headers (no Bearer prefix)
- [ ] Request handles successful 200 responses
- [ ] Request throws error on non-200 status codes
- [ ] Quota endpoint called with correct URL
- [ ] Response parsed as JSON
- [ ] Data processed with `processQuotaLimit()`
- [ ] Output formatted with ASCII table
- [ ] Progress bars displayed for percentage values

**Files to Create:**
- `tests/module/http-client.test.ts`
- `tests/integration/quota-query-pipeline.test.ts`
- `tests/fixtures/api-quota-success.json`
- `tests/mocks/https.mock.ts`

**Dependencies:** Slice 1 (auth), Slice 2 (utilities, display)

---

### SLICE 4: Multiple Endpoints & Display

**User Value:** Users see complete usage statistics including model usage and MCP tool usage.

**Acceptance Criteria:**
- [ ] Model usage endpoint called with time window query params
- [ ] Tool usage endpoint called with time window query params
- [ ] Query parameters URL-encoded properly
- [ ] All three endpoints queried sequentially (not parallel)
- [ ] Each section displays in ASCII table format
- [ ] Model usage JSON truncated to fit table (8 lines max)
- [ ] Tool usage JSON truncated to fit table (8 lines max)
- [ ] Platform displayed in header
- [ ] Time window displayed in header
- [ ] End-to-end integration test passes

**Files to Create:**
- `tests/integration/full-query-pipeline.test.ts`
- `tests/fixtures/api-model-success.json`
- `tests/fixtures/api-tool-success.json`

**Dependencies:** Slice 3 (single endpoint working)

---

### SLICE 5: Error Handling & Edge Cases

**User Value:** Users see helpful error messages when things go wrong, no crashes or confusing behavior.

**Acceptance Criteria:**
- [ ] Network errors (timeout, connection refused) caught and handled
- [ ] Authentication errors (401, 403) display user-friendly message
- [ ] API errors (429, 500) propagate with clear context
- [ ] Parse errors (invalid JSON, missing fields) caught and reported
- [ ] Tokens never appear in error messages (sanitized)
- [ ] Each error type has dedicated test suite
- [ ] Integration tests cover error paths

**Files to Create:**
- `tests/error-handling/network-errors.test.ts`
- `tests/error-handling/auth-errors.test.ts`
- `tests/error-handling/api-errors.test.ts`
- `tests/error-handling/parse-errors.test.ts`
- `tests/fixtures/api-error-401.json`
- `tests/fixtures/api-error-500.json`

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

**Sprint 2: Utilities**
- Complete Slice 2
- 2-3 days
- Deliverable: All utility functions tested, time window working

**Phase 1 Exit Criteria:**
- [ ] All functional tests pass (pure functions)
- [x] All module tests pass (with mocks) - Slice 1 complete
- [x] Credential discovery working - Slice 1 complete
- [ ] Time window calculation accurate
- [x] Code compiles without errors - Slice 1 complete

---

### Phase 2: MVP Feature (Slice 3)

**Goal:** First working end-to-end feature (quota limits)

**Sprint 3: Single Endpoint**
- Complete Slice 3
- 3-4 days
- Deliverable: Quota limits API working, displaying percentages

**Phase 2 Exit Criteria:**
- [ ] Single endpoint query works end-to-end
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
- [ ] All three endpoints queried
- [ ] Full output displays correctly
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

- [ ] Plugin successfully authenticates with Z.AI API
- [ ] Plugin queries all three endpoints (quota, model, tool)
- [ ] Plugin displays usage statistics in ASCII table format
- [ ] Plugin shows progress bars for quota percentages
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

- [ ] All three endpoints working
- [ ] Both platforms supported (ZAI, ZHIPU)
- [ ] Authentication working (OpenCode + env vars)
- [ ] Time window calculation accurate
- [ ] Output displays correctly
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

✅ **Execution Guide** - How to use the plan, TDD workflow, debugging approach

**Next Steps:**

1. Review this plan thoroughly
2. Set up development environment
3. Start with Slice 1 (Authentication)
4. Follow TDD Red-Green-Refactor for every feature
5. Complete slices in order
6. Verify checkpoints after each slice/phase
7. Celebrate when all acceptance criteria met!

---

*Document Version: 1.1*
*Created: 2026-01-17*
*Last Updated: 2026-01-18*
*Status: Slice 1 Complete, In Progress*
