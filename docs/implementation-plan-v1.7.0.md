# Implementation Plan: v1.7.0 Markdown Output Migration

**Version:** 1.0  
**Date:** March 30, 2026  
**Branch:** `feature/markdown-output-v1.7.0`  
**Target Version:** 1.7.0  
**PRD Reference:** `docs/opencode-glm-quota-prd-final.md` Section 1.11

---

## Goal

Replace all ASCII box drawing output (╔═╗║╚╠╟╢) with Rich Markdown format rendered by OpenCode's Glamour TUI. Single mode only, no legacy fallback.

## Design Decisions (Final)

| Decision | Choice |
|----------|--------|
| Migration approach | Full replacement, delete all ASCII code |
| Display mode | Single mode (no compact/full split) |
| Success format | GFM tables + h5 emoji headers + emoji row labels |
| Error format | `### ⚠️` h3 + bullet list metadata + plain text + numbered fix steps |
| Progress bars | `█░` 12-char in backtick code spans |
| Separators | No `---`, no `> blockquotes`, no HTML |

## Impact Analysis

### Files to DELETE
| File | Lines | Reason |
|------|-------|--------|
| `src/utils/box-constants.ts` | 44 | All box dimension constants unused |

### Files to REWRITE (major changes)
| File | Lines | Changes |
|------|-------|---------|
| `src/index.ts` | 743 | Delete ~250 lines box formatting (lines 390-667), rewrite as Markdown builders |
| `src/utils/progress-bar.ts` | 69 | Switch from ASCII `#-` to Unicode `█░` 12-char bars in code spans |
| `src/utils/error-formatter.ts` | 65 | Replace `createBoxedError()` with Markdown error format |
| `src/api/client.ts` | 276 | Replace all `createBoxedError()` calls with Markdown error format |

### Files UNCHANGED
| File | Reason |
|------|--------|
| `src/api/platforms.ts` | Platform detection, no output logic |
| `src/api/endpoints.ts` | Endpoint URLs, no output logic |
| `src/utils/token-limits.ts` | Label logic unchanged |
| `src/utils/reset-timer.ts` | Timer logic unchanged |
| `src/utils/date-formatter.ts` | Date formatting unchanged |
| `src/utils/time-window.ts` | Window calculation unchanged |

### Tests to UPDATE (10 files, ~71 affected assertions)
| Test File | What Changes |
|-----------|--------------|
| `tests/integration/box-alignment.test.ts` | DELETE entirely (tests ASCII box alignment) |
| `tests/integration/plugin-catch-block.test.ts` | Replace `╔╚║` checks + `BOX_WIDTH` with Markdown checks |
| `tests/integration/error-handling.test.ts` | Replace box checks with Markdown error format checks |
| `tests/integration/reset-time-display.test.ts` | Update output assertions for Markdown format |
| `tests/functional/progress-bar.test.ts` | Update to test `█░` bars instead of `#-` |
| `tests/error-handling/auth-errors.test.ts` | Replace `BOX_WIDTH` + `╔╚║` with Markdown checks |
| `tests/error-handling/api-errors.test.ts` | Replace `BOX_WIDTH` + `╔╚║` with Markdown checks |
| `tests/error-handling/parse-errors.test.ts` | Replace `BOX_WIDTH` + `╔╚║` with Markdown checks |
| `tests/error-handling/network-errors.test.ts` | Replace `BOX_WIDTH` + `createBoxedError` with Markdown checks |
| `tests/error-handling/token-sanitization.test.ts` | Likely minor or no changes |

---

## Implementation Slices

### Slice 1: Delete box-constants + Create markdown-constants (Foundation)

**Goal:** Remove the old foundation and create the new one.

**Tasks:**
1. Delete `src/utils/box-constants.ts`
2. Create `src/utils/markdown-constants.ts` with:
   - Progress bar width (12 chars)
   - Section header emojis
   - Row label emojis
   - Error format templates
3. Update all imports that reference `box-constants`

**Files changed:**
- `src/utils/box-constants.ts` → DELETE
- `src/utils/markdown-constants.ts` → CREATE
- `src/index.ts` → Update import
- `src/utils/progress-bar.ts` → Update import
- `src/utils/error-formatter.ts` → Update import
- `src/api/client.ts` → Update import

**Verify:** `npm run build` compiles (tests will fail, expected)

---

### Slice 2: Rewrite progress-bar.ts

**Goal:** Switch from ASCII `#-` to Unicode `█░` 12-char bars in code spans.

**Current output:** `Token usage(5 Hour)  [##################░░░░░░░░░░░░]  40.5%`  
**New output:** `` `█████░░░░░░░` `` (standalone 12-char bar, wrapped in backticks)

**Tasks:**
1. Update `createProgressBar()` to use `█` and `░` with 12-char width
2. Remove `ProgressBarOptions` (no longer needed — fixed width/chars)
3. Update `formatProgressLine()` to return Markdown table cell content
4. Remove `PROGRESS_BAR` constant references (now in markdown-constants)
5. Update `tests/functional/progress-bar.test.ts` — test `█░` bars

**Files changed:**
- `src/utils/progress-bar.ts` → REWRITE
- `tests/functional/progress-bar.test.ts` → UPDATE

**Verify:** `npm run test -- tests/functional/progress-bar.test.ts` passes

---

### Slice 3: Rewrite error-formatter.ts

**Goal:** Replace `createBoxedError()` with Markdown error format.

**Current output:**
```
╔══════════════════════════════════════════════════════════╗
║  Authentication failed. Please check your credentials.  ║
╚══════════════════════════════════════════════════════════╝
```

**New output:**
```markdown
### ⚠️ Authentication Failed

Your token was rejected by the API.

**How to fix:**
1. Run `/connect` to re-authenticate
2. Check if your subscription has expired
```

**Tasks:**
1. Delete `createBoxedError()` function
2. Create `createMarkdownError(title: string, metadata: Record<string, string>, description: string, steps?: string[]): string`
3. Keep `sanitizeToken()` unchanged
4. Update `tests/error-handling/token-sanitization.test.ts` — verify still works

**Files changed:**
- `src/utils/error-formatter.ts` → REWRITE
- `src/api/client.ts` → Update all `createBoxedError()` calls

**Verify:** `npm run test -- tests/error-handling/token-sanitization.test.ts` passes

---

### Slice 4: Rewrite client.ts error formatting

**Goal:** Replace all `createBoxedError()` calls in client.ts with `createMarkdownError()`.

**Tasks:**
1. Replace `createBoxedError` import with `createMarkdownError`
2. Update `formatNetworkError()` — return Markdown error
3. Update `formatAuthError()` — return Markdown error with platform-aware metadata
4. Update `formatApiError()` — return Markdown error
5. Update `formatParseError()` — return Markdown error
6. Update `formatErrorWithDetails()` — return Markdown error
7. Update error tests:
   - `tests/error-handling/auth-errors.test.ts`
   - `tests/error-handling/api-errors.test.ts`
   - `tests/error-handling/parse-errors.test.ts`
   - `tests/error-handling/network-errors.test.ts`

**Markdown error format per error type:**

| Error Type | Title | Description | Steps |
|------------|-------|-------------|-------|
| ETIMEDOUT | Request Failed | Connection timeout after 10s | Check network, try again |
| ECONNREFUSED | Request Failed | Unable to connect to server | Check network, try again |
| 401 | Authentication Failed | Token rejected | `/connect`, check subscription |
| 403 | Access Denied | No permission | Check account permissions |
| 429 | Rate Limited | Too many requests | Wait and retry |
| 5xx | Server Error | Server error | Try again later |
| Parse | Unexpected Response | Invalid JSON | Try again later |

**Files changed:**
- `src/api/client.ts` → UPDATE error formatters
- `tests/error-handling/*.test.ts` → UPDATE assertions

**Verify:** `npm run test -- tests/error-handling/` passes

---

### Slice 5: Rewrite index.ts output formatting

**Goal:** Replace ~250 lines of ASCII box formatting with Markdown table builders.

**Functions to DELETE (lines 390-667):**
- `formatBoxLine()`, `formatProgressBoxLine()`
- `getDisplayWidth()`, `trimToDisplayWidth()`
- `isControlCodePoint()`, `isZeroWidthCodePoint()`, `isEmojiCodePoint()`, `isFullWidthCodePoint()`
- `formatHeader()`, `formatQuotaLimits()`, `formatDataSection()`, `formatFooter()`, `formatOutput()`

**Functions to KEEP (lines 1-389):**
- All credential discovery (`getCredentials`, `extractKeyFromEntry`, etc.)
- Response processing (`processQuotaLimit`)
- Number formatting helpers (`formatNumber`, `getTokenLimitInfo`, etc.)
- Data extraction helpers (`formatMcpToolLines`, `formatTokenUsageLines`, etc.)

**New Markdown builder functions:**
1. `formatMarkdownHeader(platform, startTime, endTime, level)` → h3 title + bullet metadata
2. `formatQuotaLimitsTable(quotaData)` → 4-column GFM table with emoji labels
3. `formatQuotaUsageTable(quotaData)` → 2-column usage summary table
4. `formatMcpBreakdownTable(quotaData)` → 2-column MCP tool breakdown
5. `formatModelUsageTable(modelData, quotaData)` → 2-column model stats table
6. `formatToolUsageTable(toolData)` → 2-column tool usage table
7. `formatMarkdownOutput(...)` → Compose all sections

**Target output:**
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
...
```

**Also update:**
- `createCredentialError()` → Return Markdown error instead of ASCII box
- Plugin `execute()` catch block → Remove `╔╚` detection, use Markdown error

**Files changed:**
- `src/index.ts` → MAJOR REWRITE

**Verify:** `npm run build` compiles

---

### Slice 6: Update integration tests

**Goal:** Update all integration tests to verify Markdown output instead of ASCII boxes.

**Tasks:**
1. **DELETE** `tests/integration/box-alignment.test.ts` entirely
2. **UPDATE** `tests/integration/plugin-catch-block.test.ts`:
   - Replace `╔╚║` assertions with Markdown format checks
   - Replace `BOX_WIDTH.TOTAL` line length checks with Markdown structure checks
   - Test for `### ⚠️` header, `- **Platform**:` metadata, numbered fix steps
3. **UPDATE** `tests/integration/error-handling.test.ts`:
   - Same pattern: replace box checks with Markdown checks
4. **UPDATE** `tests/integration/reset-time-display.test.ts`:
   - Update assertions for Markdown table format instead of box format
5. **CREATE** `tests/integration/markdown-output.test.ts`:
   - Test full Markdown output structure
   - Verify table headers, emoji labels, progress bars in code spans
   - Verify section separators (h5 headers)

**Files changed:**
- `tests/integration/box-alignment.test.ts` → DELETE
- `tests/integration/plugin-catch-block.test.ts` → UPDATE
- `tests/integration/error-handling.test.ts` → UPDATE
- `tests/integration/reset-time-display.test.ts` → UPDATE
- `tests/integration/markdown-output.test.ts` → CREATE

**Verify:** `npm run test -- tests/integration/` passes

---

### Slice 7: Version bump + Final cleanup

**Goal:** Bump version, clean up, verify everything works.

**Tasks:**
1. Update `package.json` version: `1.6.3` → `1.7.0`
2. Update `sonar-project.properties` version: `1.6.3` → `1.7.0`
3. Update `CHANGELOG.md` with v1.7.0 entry
4. Update `README.md` output example to show Markdown format
5. Run full test suite: `npm test`
6. Run build: `npm run build`
7. Run lint: `npm run lint`
8. Verify no references to `box-constants` remain in source or tests

**Files changed:**
- `package.json` → Version bump
- `sonar-project.properties` → Version bump
- `CHANGELOG.md` → Add v1.7.0 entry
- `README.md` → Update output example

**Verify:** `npm run build && npm run lint && npm test` all pass

---

## Execution Order & Dependencies

```
Slice 1 (foundation)
    ↓
Slice 2 (progress bar)  ←  independent from Slice 3
Slice 3 (error formatter) ←  independent from Slice 2
    ↓                       ↓
Slice 4 (client errors) ← depends on Slice 3
    ↓
Slice 5 (index.ts output) ← depends on Slice 1, 2, 4
    ↓
Slice 6 (integration tests) ← depends on Slice 5
    ↓
Slice 7 (version bump + cleanup) ← depends on all above
```

**Parallel opportunity:** Slices 2 and 3 can be done in parallel.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Markdown table rendering differs in Glamour | Test in OpenCode TUI before merge |
| Progress bar display width in code spans | `█░` are single-width Unicode, should render fine |
| Missing emoji support in some terminals | Emojis degrade gracefully to empty — tables still render |
| Breaking change for users parsing output | Version bump to 1.7.0 (minor), document in CHANGELOG |

## Estimated Effort

| Slice | Files | Estimated Time |
|-------|-------|---------------|
| Slice 1 | 6 | 15 min |
| Slice 2 | 2 | 20 min |
| Slice 3 | 2 | 20 min |
| Slice 4 | 5 | 30 min |
| Slice 5 | 1 | 45 min |
| Slice 6 | 5 | 30 min |
| Slice 7 | 4 | 15 min |
| **Total** | **25 files** | **~2.5 hours** |
