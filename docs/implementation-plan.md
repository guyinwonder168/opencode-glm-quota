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
| Slice 5: Error Handling & Edge Cases | 🔄 **IN PROGRESS** | 2026-02-01 | 96 | N/A |
| Slice 6: Refactoring & Optimization | ⏳ **TODO** | - | - | - |

**Overall Progress:** 8/9 slices complete (88.9%), Slice 5 in progress (12 tasks complete)

---

## 3. Vertical Slices (Detailed)

[... Previous slices omitted for brevity, keeping Slice 5 ...]

### SLICE 5: Error Handling & Edge Cases

**User Value:** Users see helpful error messages when things go wrong, no crashes or confusing behavior.

**Status:** ⏳ **IN PROGRESS** (2026-01-31)  
**Priority:** High (production-ready requirement)
**Estimated Time:** ~7 hours (16 tasks across 6 phases)

**Acceptance Criteria:**
- [x] Network errors (timeout, connection refused) caught and handled
- [x] Authentication errors (401, 403) display user-friendly message
- [x] API errors (429, 500) propagate with clear context
- [x] Parse errors (invalid JSON, missing fields) caught and reported
- [x] Tokens never appear in error messages (sanitized)
- [x] Each error type has dedicated test suite
- [x] Integration tests cover error paths
- [x] All errors use 60-char boxed format for consistency

**Task Breakdown (16 Tasks, 6 Phases):**

**Phase 1: Setup & Infrastructure (Tasks 1-3)**
- Task 1: Create `tests/error-handling/` directory structure ✅
- Task 2: Create error fixtures (`401.json`, `403.json`, `429.json`, `500.json`) ✅
- Task 3: TDD: Token sanitization utility (test → implement → refactor) ✅

**Phase 2: Network Error Handling (Tasks 4-5)**
- Task 4: TDD: Network timeout error handling (boxed output, 10s timeout) ✅
- Task 5: TDD: Network connection errors (ECONNREFUSED, ENOTFOUND) ✅

**Phase 3: Authentication Error Handling (Tasks 6-7)**
- Task 6: TDD: 401 Unauthorized error (boxed with `/connect` instructions) ✅
- Task 7: TDD: 403 Forbidden error (boxed with permission message) ✅

**Phase 4: API & Parse Error Handling (Tasks 8-10)**
- Task 8: TDD: 429 Rate limiting error (boxed with retry guidance) ✅
- Task 9: TDD: 500+ Server errors (boxed with "try later" message) ✅
- Task 10: TDD: Invalid JSON parse errors (boxed, sanitized) ✅

**Phase 5: Integration & Consistency (Tasks 11-14)**
- Task 11: Box all error outputs in `src/index.ts` catch block ✅
- Task 12: Create `src/utils/error-formatter.ts` (consolidate boxed errors) ✅
- Task 13: Integration tests: End-to-end error paths (network, auth, API, parse) 🔄
- Task 14: Run full test suite - verify all 50+ existing tests still pass 🔄

**Phase 6: Finalization (Tasks 15-16)**
- Task 15: Update `docs/implementation-plan.md` (mark Slice 5 complete)
- Task 16: Git commit & push: `feat: comprehensive error handling with token sanitization`

[... Rest of plan omitted ...]
