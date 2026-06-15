# Implementation Plan: v1.8.0 Reset Timestamp Display (Local Timezone)

**Version:** 1.0  
**Date:** June 15, 2026  
**Branch:** `fix/reset-timer-timezone-34`  
**Target Version:** 1.8.0  
**Issue:** [#34 — Display actual reset timestamp in local timezone](https://github.com/guyinwonder168/opencode-glm-quota/issues/34)  
**PRD Reference:** `docs/opencode-glm-quota-prd-final.md` Section 1.12

---

## Goal

Show the actual reset clock time in the user's local timezone alongside the existing countdown, so users in far-from-UTC zones can plan around resets without guessing when they occur.

## Problem

**Before:** `| ⏱️ 5h Token | 87.0% | ████████████████░░░░░ | 4h 36m |`  
**After:** `| ⏱️ 5h Token | 87.0% | ████████████████░░░░░ | 4h 36m (01:34) |`

For long durations (≥24h), also show the weekday:  
`| 📅 Weekly | 17.0% | ████░░░░░░░░░░░░░░░░ | 6d 16h (Sat 13:48) |`

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timezone display format | `HH:MM` (local clock time) | Deterministic, user knows their own timezone |
| Timezone abbreviation | **Not included** | Node.js `toLocaleTimeString` TZ abbreviations are unreliable across platforms (e.g., "GMT+13" vs "NZST") |
| Long duration format | `Day HH:MM` (e.g., `Sat 13:48`) | Matches issue's proposed format for weekly resets |
| API for local time | `getHours()`, `getMinutes()`, `getDay()` | Follows existing `date-formatter.ts` pattern, no dependencies |
| Testing approach | Regex assertions in integration tests | Timezone-dependent output made deterministic via pattern matching |

## Impact Analysis

### Files MODIFIED

| File | Changes |
|------|---------|
| `src/index.ts` | `formatResetCell()` — add local time display after countdown |
| `tests/integration/reset-time-display.test.ts` | Update assertions: `includes` → `match` with regex for time pattern |
| `package.json` | Version: `1.7.0` → `1.8.0` |
| `sonar-project.properties` | `sonar.projectVersion`: `1.7.0` → `1.8.0` |
| `CHANGELOG.md` | Add `[1.8.0]` entry |
| `README.md` | Update feature bullet + output example |
| `docs/opencode-glm-quota-prd-final.md` | Add Section 1.12 |

### Files UNCHANGED

| File | Reason |
|------|--------|
| `src/utils/reset-timer.ts` | Long-form `formatTimeUntilReset()` not used in Markdown table, separate concern |
| All other `src/` files | No output or logic changes needed |

---

## Implementation Slices

### Slice 1: TDD RED — Update integration test assertions

**Goal:** Write failing tests that describe the desired new format.

**Changes to `tests/integration/reset-time-display.test.ts`:**
- Short duration test: `includes('| ... | 4h 42m |')` → `match(/\| ... \| 4h 42m \(\d{2}:\d{2}\) \|/)`
- Long duration test: `includes('| ... | 4d 12h |')` → `match(/\| ... \| 4d 12h \([A-Z][a-z]{2} \d{2}:\d{2}\) \|/)`
- MCP test: Unchanged (no reset time → still `—`)

**Verify:** `npm run test -- tests/integration/reset-time-display.test.ts` → 2 failures (RED)

---

### Slice 2: TDD GREEN — Modify `formatResetCell()`

**Goal:** Minimum code to make tests pass.

**Changes to `src/index.ts` `formatResetCell()` (was lines 283-301):**

```typescript
function formatResetCell(resetTime?: number): string {
  const resetAt = asNumber(resetTime);
  if (resetAt === null) return '—';

  const diffMs = resetAt - Date.now();
  if (diffMs <= 0) return '—';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  // Format countdown portion
  let countdown: string;
  if (totalMinutes >= 24 * 60) {
    const totalHours = Math.floor(totalMinutes / 60);
    countdown = `${Math.floor(totalHours / 24)}d ${totalHours % 24}h`;
  } else {
    countdown = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  }

  // Format local reset time portion (Issue #34)
  const resetDate = new Date(resetAt);
  const hh = String(resetDate.getHours()).padStart(2, '0');
  const mm = String(resetDate.getMinutes()).padStart(2, '0');

  if (totalMinutes >= 24 * 60) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${countdown} (${dayNames[resetDate.getDay()]} ${hh}:${mm})`;
  }

  return `${countdown} (${hh}:${mm})`;
}
```

**Verify:** `npm run test -- tests/integration/reset-time-display.test.ts` → all pass (GREEN)

---

### Slice 3: Full test suite verification

**Goal:** Ensure no regressions.

**Verify:** `npm test` → 117 tests pass, 0 failures

---

### Slice 4: Documentation + version bump

**Tasks:**
1. `package.json`: `1.7.0` → `1.8.0`
2. `sonar-project.properties`: `sonar.projectVersion` `1.7.0` → `1.8.0`
3. `CHANGELOG.md`: Add `[1.8.0]` entry under `[Unreleased]`
4. `README.md`: Update feature bullet + output example
5. `docs/opencode-glm-quota-prd-final.md`: Add Section 1.12

**Verify:** `npm run build && npm run lint && npm test` all pass

---

## Execution Order

```
Slice 1 (RED tests)
    ↓
Slice 2 (GREEN implementation)
    ↓
Slice 3 (full suite verification)
    ↓
Slice 4 (docs + version bump)
```

All slices are sequential — small scope, no parallelism needed.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Timezone-dependent test output | Regex assertions (`\d{2}:\d{2}`) instead of hardcoded times |
| Cell width increase | "Resets In" column is last, Markdown tables auto-size — no alignment issues |
| DST transitions | `getHours()`/`getMinutes()` always return local time per system TZ — correct by design |
| Node.js version differences | Using standard `Date` methods available since ES1 — universally supported |

## Estimated Effort

| Slice | Files | Time |
|-------|-------|------|
| Slice 1 | 1 | 10 min |
| Slice 2 | 1 | 10 min |
| Slice 3 | 0 | 5 min |
| Slice 4 | 5 | 20 min |
| **Total** | **7 files** | **~45 min** |
