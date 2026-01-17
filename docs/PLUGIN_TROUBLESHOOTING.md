# Plugin Installation & Troubleshooting

## Current Status
✅ **Plugin Code:** Correct (exports `GlmQuotaPlugin` function)
✅ **File Location:** `.opencode/plugin/glm-quota.js` (92 lines)
✅ **TypeScript Compiles:** Clean build
❌ **OpenCode Error:** "TypeError: null is not an object (evaluating 'hook.config')"

## Issue Analysis

The error indicates OpenCode is trying to:
1. Evaluate 'hook.config' (which we don't export)
2. Getting `null` instead of expected hook object

**Root Cause:** OpenCode has **cached an old version** of the plugin with different code structure.

## Solution 1: Clear OpenCode Cache

### Clear Bun cache (recommended):
```bash
# Stop OpenCode completely (close all windows)

# Clear Bun cache
rm -rf ~/.cache/opencode
rm -rf ~/.cache/bun
```

### Clear OpenCode plugin cache:
```bash
rm -rf ~/.local/share/opencode/storage/opencode/plugins
```

### Then restart OpenCode:
1. Close OpenCode completely
2. Reopen OpenCode
3. Plugin will reload from fresh state

## Solution 2: Force Plugin Reload

Sometimes you can force OpenCode to reload plugins:

1. In OpenCode, run: `/reload`
   (if this command exists)

2. Or restart OpenCode:
   - File > Exit (Mac: Cmd+Q)
   - File > Quit (Linux/Windows: Ctrl+Q)
   - Reopen OpenCode

## Solution 3: Check for Multiple Plugin Locations

OpenCode might be loading a plugin from a different location:

```bash
# Check if plugin exists elsewhere
find ~ -name "glm-quota.js" 2>/dev/null

# Check for duplicate plugins
ls -la ~/.opencode/ 2>/dev/null
ls -la ~/.local/share/opencode/.opencode/ 2>/dev/null
```

If you find duplicate files, delete the old ones.

## Solution 4: Verify Plugin File

Check that the plugin file in `.opencode/plugin/` is correct:

```bash
# Check file exists and size
ls -lh .opencode/plugin/glm-quota.js

# Verify exports
node -e "const plugin = require('./.opencode/plugin/glm-quota.js'); console.log('Exports:', Object.keys(plugin)); console.log('Type:', typeof plugin.GlmQuotaPlugin);"
```

**Expected output:**
```
Exports: ['GlmQuotaPlugin', ...]
Type: function
```

## Solution 5: Check for Corrupted Cache

Check if any cache files are corrupted:

```bash
# Check cache directory
ls -la ~/.cache/opencode/

# If corrupted, delete and rebuild
rm -rf ~/.cache/opencode
```

## Solution 6: Reinstall OpenCode (Last Resort)

If nothing else works:

```bash
# Uninstall OpenCode
# (Follow your installation method: npm, brew, etc.)

# Remove all OpenCode data (WARNING: This deletes all config!)
rm -rf ~/.local/share/opencode

# Reinstall OpenCode
npm install -g opencode-ai

# Configure fresh
opencode
```

---

## Testing After Cache Clear

After clearing cache and restarting OpenCode, test:

1. Run: `/glm_quota`
2. Expected output:
   ```
   No credentials found. Please authenticate by running /connect command in OpenCode.
   
   Supported providers:
   - Z.AI Coding Plan (recommended)
   - Z.AI
   - Zhipu
   
   For development/testing, you can also set environment variables for appropriate platform.
   ```

3. If error persists, check OpenCode logs:
   - View > Output
   - Look for red error messages
   - Copy full error to clipboard for debugging

---

## Current Plugin Code Structure

The plugin correctly exports:
- `GlmQuotaPlugin` (async function that returns hooks object)
- Hooks: `{ tool: { glm_quota: ToolDefinition } }`
- Tool: `/glm_quota` command with description and execute function

This follows the exact SDK pattern from:
https://opencode.ai/docs/sdk/

---

## Quick Fix Checklist

- [ ] Restarted OpenCode completely (all windows)
- [ ] Cleared Bun cache: `rm -rf ~/.cache/opencode`
- [ ] Cleared plugin cache: `rm -rf ~/.local/share/opencode/storage/opencode/plugins`
- [ ] Verified `.opencode/plugin/glm-quota.js` is latest version
- [ ] Verified plugin exports: `node -e "require('./.opencode/plugin/glm-quota.js')"`
- [ ] Tested `/glm_quota` command in fresh OpenCode instance

---

## If All Else Fails

Try installing plugin in different directory:

```bash
# Try global plugin directory
mkdir -p ~/.config/opencode/plugin/
cp .opencode/plugin/glm-quota.js ~/.config/opencode/plugin/
```

Then test in OpenCode.
