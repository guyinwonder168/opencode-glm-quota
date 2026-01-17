# Testing Slice 1: Authentication & Credential Discovery

## Installation Complete ✅

The plugin is now installed and should be automatically loaded by OpenCode.

**Installation Location:** `.opencode/plugin/glm-quota.js`

---

## Testing Methods

### Method 1: Direct Command Test (Recommended)

1. **Restart OpenCode** (if it's running)
   - Close OpenCode completely
   - Reopen OpenCode
   - Plugin will auto-load from `.opencode/plugin/` directory

2. **Test without credentials** (Expected Error):
   ```
   /glm_quota
   ```
   **Expected Output:**
   ```
   No credentials found. Please authenticate by running /connect command in OpenCode.

   Supported providers:
   - Z.AI Coding Plan (recommended)
   - Z.AI
   - Zhipu

   For development/testing, you can also set environment variables for appropriate platform.
   ```

3. **Test with environment variable** (ZAI):
   ```bash
   # In your terminal
   export ZAI_API_KEY="test-token-123"
   ```
   Then in OpenCode:
   ```
   /glm_quota
   ```
   **Expected Output:**
   ```
   ✅ Credentials found for ZAI platform

   Feature coming soon: quota limits, model usage, and MCP tool usage statistics.
   ```

4. **Test with environment variable** (ZHIPU):
   ```bash
   export ZHIPU_API_KEY="test-token-456"
   ```
   Then in OpenCode:
   ```
   /glm_quota
   ```
   **Expected Output:**
   ```
   ✅ Credentials found for ZHIPU platform

   Feature coming soon: quota limits, model usage, and MCP tool usage statistics.
   ```

### Method 2: Production Authentication Test

1. **Authenticate via OpenCode**:
   ```
   /connect
   ```
   Select "Z.AI Coding Plan" or "Z.AI" or "Zhipu"

2. **Test with authenticated session**:
   ```
   /glm_quota
   ```
   **Expected Output:**
   ```
   ✅ Credentials found for ZAI platform

   Feature coming soon: quota limits, model usage, and MCP tool usage statistics.
   ```

### Method 3: Unit Tests (Development)

Run the automated test suite:

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"
npm test
```

**Expected Result:** All 16 tests passing

---

## Troubleshooting

### Issue: `/glm_quota` command not found

**Solution:** Restart OpenCode completely
- Close all OpenCode windows
- Reopen OpenCode
- Plugin will auto-load from `.opencode/plugin/`

### Issue: Module import errors

**Solution:** Ensure TypeScript compiled
```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"
npm run build
```

### Issue: Plugin not loading

**Solution:** Check plugin location
```bash
ls -la .opencode/plugin/glm-quota.js
```

If file doesn't exist, copy it manually:
```bash
cp dist/index.js .opencode/plugin/glm-quota.js
```

---

## Verification Checklist

- [ ] Plugin loads without errors (check OpenCode startup logs)
- [ ] `/glm_quota` command is available
- [ ] Error message displays when no credentials
- [ ] Environment variable fallback works
- [ ] Authentication via `/connect` works
- [ ] All 16 unit tests pass

---

## Next Steps

After verifying Slice 1 works:

1. ✅ Authentication & Credential Discovery - **COMPLETE**
2. ⏳ Time Window & Utility Functions
3. ⏳ Single Endpoint Query
4. ⏳ Multiple Endpoints & Display
5. ⏳ Error Handling & Edge Cases
6. ⏳ Refactoring & Optimization
