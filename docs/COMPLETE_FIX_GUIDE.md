# Complete Fix & Testing Guide

## 🚨 Current Issue

**Error:** "TypeError: null is not an object (evaluating 'hook.config') at init2 (src/plugin/index.ts:124:13)"

**Root Cause:** OpenCode is finding plugin files in unexpected locations and trying to load them, causing conflicts.

---

## ✅ Solution: Complete Clean Install

### Step 1: Remove ALL problematic directories

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Remove all OpenCode-related directories
rm -rf .opencode
rm -rf .git/opencode
rm -rf node_modules/@opencode-ai

# Remove source directory if present
rm -rf src

# Remove test files
rm -rf tests

# Clean git
git clean -fdX
```

### Step 2: Fresh Build

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"
npm run build
```

### Step 3: Copy ONLY the compiled plugin

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Create fresh plugin directory
mkdir -p .opencode/plugin

# Copy ONLY the compiled JavaScript file
cp dist/index.js .opencode/plugin/glm-quota.js

# Verify only 1 file exists
ls -la .opencode/plugin/
# Expected: glm-quota.js ONLY (no .d.ts, no .map)
```

### Step 4: Verify Plugin Structure

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Check that ONLY the plugin file exists
ls -la .opencode/plugin/

# Check that source directory is GONE
ls -la src/ 2>&1 || echo "src directory removed (correct)"

# Check that git/opencode is GONE
ls -la .git/opencode 2>&1 || echo "git/opencode removed (correct)"
```

### Step 5: Verify Compiled Plugin

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Check plugin exports
node -e "const plugin = require('./dist/index.js'); console.log('Exports:', Object.keys(plugin)); console.log('GlmQuotaPlugin:', typeof plugin.GlmQuotaPlugin);"

# Expected output:
# Exports: ['GlmQuotaPlugin', 'createCredentialError', 'getCredentials', 'getProviderPlatform']
# GlmQuotaPlugin: function
```

### Step 6: Commit Clean State

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"
git add -A
git commit -m "fix: complete clean install of plugin

- Removed all OpenCode directories (.opencode, .git/opencode, node_modules)
- Removed src directory to prevent conflicts
- Ensured only compiled plugin in .opencode/plugin/
- Clean git state with clean -fdX
- Plugin should now load without errors"

git push
```

---

## 🧪 Testing After Clean Install

### Option 1: From Project Directory (After Cleaning)

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Restart OpenCode completely
# Then run:
opencode

# Then test:
/glm_quota

# Expected: Error message about missing credentials
```

### Option 2: From Outside Project Directory (Recommended)

```bash
# First, navigate OUTSIDE project:
cd ~
# OR
cd /tmp

# Then run OpenCode:
opencode

# In OpenCode, navigate to project:
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Then test:
/glm_quota

# Expected: Error message about missing credentials
```

### Option 3: Set Environment Variable First

```bash
cd "/media/eddy/hdd/Project/GLMStatus Plugin"

# Set environment variable
export ZAI_API_KEY="test-token-123"

# Restart OpenCode completely

# Then test:
/glm_quota

# Expected: "Credentials found for ZAI platform"
```

---

## 🔍 If Still Failing

After complete clean install, if you still see errors:

### 1. Check OpenCode Working Directory

Open OpenCode and check what directory it's in:
- In OpenCode, press `Cmd+Shift+P` (Mac/Linux) or `Ctrl+Shift+P` (Windows)
- Look at bottom left or in file explorer
- This shows the actual working directory

### 2. Force Reload in OpenCode

Try:
```
/reload
```
(If this command exists)

### 3. Check for Multiple OpenCode Instances

```bash
# Check for running OpenCode processes
ps aux | grep -i opencode

# Kill all but one if multiple found
killall opencode

# Then restart fresh
```

### 4. Manual Plugin Installation

As last resort, manually copy plugin:

```bash
# Copy plugin to your OpenCode config directory
cp dist/index.js ~/.config/opencode/plugin/glm-quota.js

# Restart OpenCode
```

---

## 📊 Current File Structure (After Clean)

Project should look like:

```
GLMStatus Plugin/
├── dist/
│   └── index.js              # Compiled plugin ONLY
├── package.json                 # Package manifest
├── tsconfig.json               # TypeScript config
├── .opencode/
│   └── plugin/
│       └── glm-quota.js    # Single compiled file ONLY
└── docs/
    ├── implementation-plan.md
    └── TESTING_SLICE1.md
```

**IMPORTANT:** NO `src/` directory, NO `.d.ts` files, NO `node_modules` in `.opencode/`

---

## ✅ Success Criteria

When plugin works correctly:

- ✅ No "null is not an object" error
- ✅ `/glm_quota` command is available
- ✅ Error message displays when no credentials
- ✅ Environment variable fallback works
- ✅ Plugin loads from `.opencode/plugin/glm-quota.js`

---

## 🎯 Next Steps

Once plugin loads successfully:

1. ✅ **Slice 1 Complete** - Credential discovery working
2. 🔄 **Slice 2** - Time Window & Utility Functions
3. 🔄 **Slice 3** - Single Endpoint Query
4. 🔄 **Slice 4** - Multiple Endpoints & Display
5. 🔄 **Slice 5** - Error Handling & Edge Cases
6. 🔄 **Slice 6** - Refactoring & Optimization
