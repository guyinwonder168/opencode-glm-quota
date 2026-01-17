# Gap Analysis: OpenCode GLM Quota Plugin PRD v8.2

**Document:** `docs/opencode-glm-quota-prd-final.md`
**Analysis Date:** 2026-01-15
**Status:** Suggestions - No Implementation Yet

---

## 1. Authentication Flow Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **Token Refresh** | No handling for expired/invalid tokens | Add token validation before API calls; detect 401 and prompt re-authentication |
| **Token Rotation** | No guidance on token lifecycle | Document token expiration behavior from Z.ai platform |
| **Auth State Caching** | Reads auth.json on every call | Consider caching credentials with TTL to avoid repeated file I/O |

## my feedback:
**token rotation**: we dont need rotation, as **token refresh** should solved this issue already 
**Auth state caching**: why we have to cache it ? this plugin is a status checker, so for sure user will understand that everytime we want to check the status we check and read the auth.json.

---

## 2. Error Handling Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **No Custom Error Classes** | Section 4.6 mentions them but `src/index.ts` doesn't implement them | Add `NetworkError`, `AuthenticationError`, `ApiError`, `ParseError` classes |
| **No Retry Logic** | Section 1.8 mentions "exponential backoff" but code has no implementation | Implement retry wrapper with configurable attempts/delays |
| **Silent Failures** | Line 862: `catch { /* continue to fallback */ }` swallows errors | Log or expose auth.json parse errors for debugging |
| **Partial Success** | If one endpoint fails, others continue - but no clear indication | Consider structured result with per-endpoint status |

## My feed back:
**no custom error classes** : we should implement this.
**No Retry logic** : we dont have to retry once auth were failing then we asked user to reauthenticate , if api caller for checking status were fail we just simply shows what error and what happened then asked the user to re-try later.
**silent failures**: i agree we should add this 
**partial success**: we need more clarification for this, check the query-plan.mjs for further clarification.  
---

## 3. API Contract Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **No Zod Schemas** | PRD mentions Zod for validation (Section 4.5) but code doesn't use it | Add runtime schema validation for API responses |
| **Missing `.strict()` mode** | Section 1.8 requires strict validation but not implemented | Add Zod `.strict()` to catch undocumented API fields |
| **No Response Type Guards** | Raw `JSON.parse()` with type assertions | Add type guards or Zod `safeParse()` |
| **Undocumented Error Codes** | Only HTTP status codes mentioned | Document Z.ai-specific error response formats |

## My feed back:
**no zod schemas**: where we can get the correct schema validation ? z.ai didnt provide one, we need to makes the api contract based on query-plan.mjs
**missing `.strict()` mode**: agree to add this
**no response type guards** : agree to add this
**undocumented error code** : we need to check further based on test and based on query-plan.mjs file  

---

## 4. Security Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **Token Logging** | No explicit log sanitization | Ensure token never appears in error messages |
| **File Permission** | No validation of auth.json permissions | Check file permissions (should be 600) |
| **Memory Exposure** | Token stored in plain object | Consider secure memory handling for sensitive data |

## My feedback :
**token logging**: agree need to ensure token never appears in error messages 
**file permission** : agree to add this
**memory exposure**: agree to add this 
---

## 5. Testing Strategy Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **No Mocks Implemented** | Section 4.4 defines structure but no actual mock files | Create `tests/mocks/*.ts` implementations |
| **Missing Fixtures** | Section 4.4 lists fixtures but content not defined | Define actual JSON fixture content |
| **No Timeout Tests** | Network chaos mentioned but no timeout test cases | Add tests for connection timeout, read timeout |
| **No Rate Limit Tests** | 429 handling mentioned but not tested | Add tests verifying retry behavior on 429 |
## my feedback: agree to add all
---

## 6. Configuration Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **Hardcoded Values** | Timeout, retry count, backoff factor all hardcoded | Add configuration options via plugin context or env vars |
| **No Base URL Override** | Can't point to dev/staging endpoints | Add `ZAI_BASE_URL` / `ZHIPU_BASE_URL` env var support |
| **No Timeout Config** | HTTP request has no explicit timeout | Add configurable request timeout (default 30s) |
## my feedback:
**hardcoded values**: agree to take off backoff , retry count factor on point 
**no base url override**: check query-plan.mjs 
**no timeout config**: check query-plan.mjs  
---

## 7. Flow/Logic Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **No Request Timeout** | `https.request()` at line 937 has no timeout | Add `req.setTimeout()` with proper cleanup |
| **Connection Not Closed** | No explicit `req.destroy()` on error | Ensure proper socket cleanup |
| **Concurrent Requests** | Three endpoints called sequentially | Consider `Promise.all()` for parallel requests |
| **No Request ID** | Hard to correlate logs/errors | Add request tracing ID for debugging |
## my feedback : agree to add all
---

## 8. Platform Detection Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **dev.bigmodel.cn Missing** | Line 80 of official source includes `dev.bigmodel.cn` | Add dev environment detection |
| **No Platform Override** | User can't force platform selection | Add `ZAI_PLATFORM=ZAI|ZHIPU` env var |
| **Incomplete URL Matching** | `baseUrl.includes()` could false-match | Use more precise URL parsing |
## my feedback : 
**dev.bigmodel.cn missing**: check query-plan.mjs 
**no platform overried**: check how the opencode access the glm code plan from there we should be able to detect if connection using zhippu or using codepass . 
**incomplete url matching**: agree to add
---

## 9. Output/Display Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **Truncated JSON** | Lines 1025-1029 truncate to 8 lines | Add `--verbose` flag for full output |
| **Fixed Width** | 60-char box width may break on narrow terminals | Consider dynamic width or scrollable output |
| **No Machine-Readable Output** | Only ASCII art format | Add `--json` flag for parseable output |
| **Unicode Assumptions** | Uses `█░` characters | May render poorly in some terminals |
## my feedback : 
**no machine-readable output**: nice to have .. 
**other point**: i agree
---

## 10. Documentation Gaps

| Gap | Issue | Suggestion |
|-----|-------|------------|
| **No Troubleshooting Section** | README lacks common error solutions | Add troubleshooting guide |
| **No API Limits Documentation** | What happens when quota exceeded? | Document rate limits and quota enforcement |
| **No Offline Behavior** | What if network unavailable? | Document expected behavior when offline |
## my feedback : agree to all 
---

## 11. Missing Flows

```
┌─────────────────────────────────────────────────────────────┐
│                    MISSING FLOWS                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Token Refresh Flow                                       │
│    Current: Fail on 401                                     │
│    Missing: Prompt user to re-authenticate                  │
├─────────────────────────────────────────────────────────────┤
│ 2. Graceful Degradation Flow                                │
│    Current: Show error if any endpoint fails                │
│    Missing: Show partial data when possible                 │
├─────────────────────────────────────────────────────────────┤
│ 3. Cache Invalidation Flow                                  │
│    Current: No caching                                      │
│    Missing: Optional result caching with TTL                │
├─────────────────────────────────────────────────────────────┤
│ 4. Offline Detection Flow                                   │
│    Current: Generic error on network failure                │
│    Missing: Clear "offline" state messaging                 │
├─────────────────────────────────────────────────────────────┤
│ 5. Rate Limit Recovery Flow                                 │
│    Current: Not implemented                                 │
│    Missing: Retry with backoff + user notification          │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Code-to-PRD Inconsistencies

| PRD States | Code Has | Discrepancy |
|------------|----------|-------------|
| Custom error classes (4.6) | Generic `Error` | Not implemented |
| Zod validation (4.5, 4.7) | Type assertions | Not implemented |
| Exponential backoff (1.8) | No retry logic | Not implemented |
| 85% test coverage (4.1) | No tests exist | Tests not written |
| `undici` for mocking (4.2) | Uses `https` module | Different HTTP client |

---

## 13. Priority Recommendations

### High Priority (Security/Reliability)

1. **Add request timeout handling**
   - Prevents hanging connections
   - Critical for production reliability

2. **Implement retry logic with exponential backoff**
   - Handle transient failures gracefully
   - Required for rate limit (429) responses

3. **Add proper error classes for debugging**
   - `NetworkError` - connection issues
   - `AuthenticationError` - 401/403 responses
   - `ApiError` - 4xx/5xx responses
   - `ParseError` - invalid JSON/schema

4. **Implement Zod schema validation**
   - Runtime type safety
   - Early detection of API changes

### Medium Priority (Usability)

5. **Add `--json` output format**
   - Machine-readable output for scripting
   - Integration with other tools

6. **Parallel API requests**
   - Use `Promise.all()` for concurrent endpoint calls
   - Faster overall response time

7. **Add configuration options**
   - Environment variable overrides
   - Plugin config support

8. **Better error messages with actionable guidance**
   - Clear next steps for each error type
   - Links to documentation

### Low Priority (Polish)

9. **Terminal width detection**
   - Responsive output formatting
   - Better UX on narrow terminals

10. **Result caching**
    - Avoid repeated API calls within short window
    - Configurable TTL

11. **Request tracing IDs**
    - Debug correlation
    - Log analysis support

---

## 14. Implementation Order Suggestion

```
Phase 1: Core Reliability
├── 1.1 Custom error classes
├── 1.2 Request timeout
├── 1.3 Retry logic with backoff
└── 1.4 Zod schema validation

Phase 2: Testing Foundation
├── 2.1 Mock infrastructure (undici MockAgent)
├── 2.2 Test fixtures
├── 2.3 Unit tests for pure functions
└── 2.4 Integration tests

Phase 3: Usability
├── 3.1 JSON output format
├── 3.2 Parallel API requests
├── 3.3 Configuration options
└── 3.4 Improved error messages

Phase 4: Polish
├── 4.1 Terminal width detection
├── 4.2 Result caching
├── 4.3 Request tracing
└── 4.4 Documentation updates
```

---

## 15. Questions for Clarification

Before implementation, these questions should be answered:

1. **Token Expiration**: What is the Z.ai token TTL? Does the API return refresh tokens?
2. **Rate Limits**: What are the exact rate limits? Is 429 the only rate limit signal?
3. **Error Response Format**: What is the Z.ai error response JSON structure?
4. **Offline Tolerance**: Should plugin cache last successful result for offline viewing?
5. **Platform Priority**: If both env vars set (ZAI_API_KEY and ZHIPU_API_KEY), which wins?
