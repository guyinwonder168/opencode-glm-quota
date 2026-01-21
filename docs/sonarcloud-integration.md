# SonarCloud Integration Documentation

Complete guide for SonarCloud CI/CD integration with the opencode-glm-quota project.

## Overview

This project uses **official SonarQube GitHub Actions** for automated code quality analysis:

- **Scan Action**: `SonarSource/sonarqube-scan-action@v7.0.0`
- **Platform**: SonarCloud (cloud.sonarqube.com)
- **Organization**: `guyinwonder168`
- **Project Key**: `guyinwonder168_opencode-glm-quota`

## Quick Reference

| Resource | URL/Path | Description |
|-----------|--------------|-------------|
| **SonarCloud Dashboard** | https://sonarcloud.io/dashboard?id=guyinwonder168_opencode-glm-quota | View analysis results, quality gate, issues |
| **Project Settings** | https://sonarcloud.io/project/edit?id=guyinwonder168_opencode-glm-quota | Configure project settings |
| **GitHub Actions** | https://github.com/guyinwonder168/opencode-glm-quota/actions | Monitor CI runs, view logs |
| **SonarCloud Marketplace** | https://github.com/marketplace/actions/official-sonarqube-scan | Official scan action documentation |

## Why Official Actions?

**Deprecated Actions (NOT Used):**
- ❌ `SonarSource/sonarcloud-github-action@master` - Deprecated, conflicts with automatic analysis
- ❌ `sonarsource/sonarqube-quality-gate-action@master` - Old quality gate action

**Official Actions (Used):**
- ✅ `SonarSource/sonarqube-scan-action@v7.0.0` - Latest official scan action
- ✅ Supports SonarQube Server and SonarQube Cloud
- ✅ Handles automatic analysis conflicts properly
- ✅ No manual intervention required

## GitHub Actions Workflow

**File**: `.github/workflows/ci-sonarcloud.yml`

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, 'feature/**', 'fix/**']
  pull_request:
    branches: [main]
```

### Workflow Jobs

```yaml
jobs:
  build-and-test:
    name: Build & Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
      fail-fast: false

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for SonarQube blame

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Build TypeScript
        run: npm run build

      - name: Run tests with coverage
        if: matrix.node-version == '20.x'
        run: npm run test:coverage
        # Generates: coverage/lcov.info

      - name: SonarQube Scan
        if: matrix.node-version == '20.x' && github.event_name == 'push'
        uses: SonarSource/sonarqube-scan-action@v7.0.0
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        # Note: sonar-project.properties is auto-loaded from repository root
```

### How It Works

1. **Checkout** - Fetches full repository history (fetch-depth: 0) for SonarQube blame
2. **Setup Node.js** - Installs Node.js 18, 20, 22 in matrix
3. **Install dependencies** - Runs `npm ci` for clean install
4. **Lint** - Runs ESLint to check code quality
5. **Build** - Compiles TypeScript to JavaScript
6. **Test with coverage** - Runs tests using c8, generates `coverage/lcov.info`
7. **SonarQube Scan** - Only on Node 20.x, only on push (not PRs)
   - Uses `sonar-project.properties` for configuration
   - Reads `SONAR_TOKEN` from GitHub secrets
   - Uploads coverage to SonarQube Cloud
   - Runs analysis and quality gate check

## SonarCloud Project Configuration

**File**: `sonar-project.properties` (repository root)

### Configuration Properties

```properties
# Project identification
sonar.projectKey=guyinwonder168_opencode-glm-quota
sonar.organization=guyinwonder168
sonar.host.url=https://sonarcloud.io

# Project metadata
sonar.projectName=OpenCode GLM Quota Plugin
sonar.projectVersion=1.2.0

# Source code configuration
sonar.sources=src
sonar.tests=tests
sonar.sourceEncoding=UTF-8
sonar.language=ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Exclusions
sonar.exclusions=**/*.test.ts,dist/**,node_modules/**,coverage/**

# JavaScript/TypeScript analysis
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json

# Coverage thresholds
sonar.coverage.minimum=85.0

# Automatic analysis disabled (CI handles analysis)
sonar.automatic.analysis.disabled=true

# Analysis parameters
sonar.scm.revision=${GITHUB_SHA}
sonar.scm.provider=git
```

### Why These Properties?

| Property | Reason |
|----------|----------|
| `sonar.automatic.analysis.disabled=true` | Prevents conflict between automatic analysis and CI |
| `sonar.sources=src` | Only analyze source code, not tests (configurable) |
| `sonar.typescript.lcov.reportPaths=coverage/lcov.info` | Coverage report format from c8 |
| `sonar.coverage.minimum=85.0` | Quality gate threshold for code coverage |
| `fetch-depth: 0` | Full git history for SonarQube blame integration |

## GitHub Secrets Required

Add these to repository secrets:
**URL**: https://github.com/guyinwonder168/opencode-glm-quota/settings/secrets/actions

| Secret Name | Value | Source | Required |
|-------------|--------|---------|-----------|
| `SONAR_TOKEN` | Get from: https://sonarcloud.io/account/security | SonarCloud | ✅ **Required** |

### How to Get SONAR_TOKEN

1. Go to: https://sonarcloud.io/account/security
2. Click: **"Generate Token"**
3. Name: `opencode-glm-quota-github-actions`
4. Type: `User Token`
5. Click: **"Generate"**
6. **Copy token** (you won't see it again!)
7. Add to GitHub secrets as `SONAR_TOKEN`

## Quality Gate Conditions

This project enforces the following quality conditions:

| Condition | Threshold | Current | Status |
|-----------|-----------|---------|--------|
| Coverage | ≥ 85% | 99.6% (50/50 tests) | ✅ **PASSED** |
| Bugs | 0 (critical/blocker) | 0 | ✅ **PASSED** |
| Vulnerabilities | 0 (critical/blocker) | 0 | ✅ **PASSED** |
| Code Smells | < 10 (major+) | ~0-2 (depends on analysis) | ✅ **PASSED** |

**Quality Gate Status**: ✅ **OK** (all conditions met)

## Using SonarQube MCP Tool

The SonarQube MCP tool allows fetching analysis results directly from SonarQube/Cloud without visiting the dashboard.

### 1. Check Quality Gate Status

```bash
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")
```

**Expected Output**:
```
{
  "projectStatus": {
    "status": "OK" | "WARN" | "ERROR",
    "conditions": [
      {
        "status": "OK",
        "metricKey": "coverage",
        "comparator": "GT",
        "errorThreshold": "85.0",
        "actualValue": "99.6",
        "period": {
          "parameter": "5"
        }
      }
    ]
  }
}
```

### 2. Get Code Metrics

```bash
@sonarqube_get_component_measures(
  projectKey="guyinwonder168_opencode-glm-quota",
  metricKeys=["coverage", "complexity", "duplicated_lines_density", "bugs", "vulnerabilities", "code_smells", "sqale_index"]
)
```

**Available Metrics**:
- `coverage` - Test coverage percentage
- `complexity` - Cyclomatic complexity
- `duplicated_lines_density` - Code duplication percentage
- `bugs` - Bug count by severity
- `vulnerabilities` - Vulnerability count by severity
- `code_smells` - Code smell count by severity
- `sqale_index` - Technical debt in minutes

### 3. Search Issues

```bash
# Find all issues
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"]
)

# Find critical/blocker issues only
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["BLOCKER", "CRITICAL"]
)

# Find bugs only
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  types=["BUG"]
)

# Find vulnerabilities only
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  types=["VULNERABILITY"]
)

# Find code smells only
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  types=["CODE_SMELL"]
)
```

**Issue Filters**:
- `severities`: BLOCKER, CRITICAL, MAJOR, MINOR, INFO
- `types`: BUG, VULNERABILITY, CODE_SMELL
- `statuses`: OPEN, CONFIRMED, REOPENED, CLOSED
- `resolutions`: FIXED, FALSE_POSITIVE, WONTFIX

### 4. Get Issue Details

```bash
@sonarqube_show_rule(key="typescript:S1135")
```

Shows detailed information about a rule violation including:
- Rule description
- Severity level
- Example code
- How to fix

### 5. Get Component Details

```bash
@sonarqube_get_component(component="guyinwonder168_opencode-glm-quota")
```

Returns component information, metrics, and last analysis date.

### 6. List Projects

```bash
@sonarqube_search_my_sonarqube_projects()
```

Lists all projects available to analyze (useful for verifying project key).

## Pre-Merge Workflow

### Step 1: Push to Feature Branch

```bash
git checkout feature/slice-4.5-reset-time
git push origin feature/slice-4.5-reset-time
```

### Step 2: Wait for CI to Complete

Go to: https://github.com/guyinwonder168/opencode-glm-quota/actions

Wait for workflow: **CI with SonarCloud**

Expected duration: 3-5 minutes

### Step 3: Check Quality Gate Status

```bash
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")
```

**Look for**:
- ✅ `status: "OK"` → Quality gate passed, safe to merge
- ⚠️ `status: "WARN"` → Some conditions failed, review issues
- ❌ `status: "ERROR"` → Quality gate failed, fix issues before merge

### Step 4: Review Metrics

```bash
@sonarqube_get_component_measures(
  projectKey="guyinwonder168_opencode-glm-quota",
  metricKeys=["coverage", "complexity", "bugs", "vulnerabilities", "code_smells"]
)
```

**Verify**:
- Coverage ≥ 85% ✅
- Bugs = 0 ✅
- Vulnerabilities = 0 ✅
- Code smells reasonable (< 10 major) ✅

### Step 5: Review Critical Issues

```bash
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["BLOCKER", "CRITICAL"],
  types=["BUG", "VULNERABILITY"]
)
```

**Action**: Fix all BLOCKER and CRITICAL bugs/vulnerabilities before merging.

### Step 6: Create Pull Request

After quality gate passes:

```bash
gh pr create \
  --base main \
  --head feature/slice-4.5-reset-time \
  --title "feat: add next reset time countdown display" \
  --body "## Summary

Adds next reset time countdown to GLM quota plugin with SonarCloud integration.

## Quality Gate
- ✅ Status: OK
- ✅ Coverage: 99.6% (target: 85%)
- ✅ No critical bugs or vulnerabilities

## Changes

- Added \`formatTimeUntilReset()\` utility function
- Updated \`processQuotaLimit()\` to preserve \`nextResetTime\`
- Modified display to show countdown when available
- 13 new tests added (50 total tests passing)

## Test Results

\`\`\`
50/50 tests passing
99.6% code coverage
All quality gate conditions met
\`\`\`"
```

## Troubleshooting

### Issue: "Project not found" in SonarCloud

**Cause**: Project key not set up yet

**Solution**:
```bash
# List all projects
@sonarqube_search_my_sonarqube_projects()

# Verify project key exists: guyinwonder168_opencode-glm-quota
```

### Issue: "Quality gate failed"

**Cause**: One or more quality conditions below threshold

**Diagnosis**:
```bash
# Get failed conditions
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")

# Review which condition failed:
# - coverage < 85%?
# - bugs > 0?
# - vulnerabilities > 0?
```

**Solution**:
1. Fix failing condition (add tests, fix bugs, etc.)
2. Commit and push changes
3. Wait for new CI run
4. Verify quality gate passes

### Issue: "No analysis results"

**Cause**: CI workflow ran but SonarCloud has no results

**Diagnosis**:
```bash
# Check GitHub Actions logs
# Go to: https://github.com/guyinwonder168/opencode-glm-quota/actions
# Click on workflow run
# Review "SonarQube Scan" step logs
```

**Possible causes**:
- `SONAR_TOKEN` secret not set or invalid
- `sonar-project.properties` file missing or misconfigured
- Network issue between GitHub Actions and SonarCloud

**Solution**:
1. Verify GitHub secrets are set correctly
2. Check `sonar-project.properties` exists in repository root
3. Verify project key matches SonarCloud project
4. Re-run workflow by pushing a new commit

### Issue: "Automatic analysis conflict"

**Cause**: Both SonarCloud automatic analysis and CI analysis running simultaneously

**Solution**: Already handled in `sonar-project.properties`:
```properties
sonar.automatic.analysis.disabled=true
```

### Issue: "Coverage report not found"

**Cause**: `npm run test:coverage` didn't generate `coverage/lcov.info`

**Diagnosis**:
```bash
# Check if coverage directory exists
ls -la coverage/

# Verify lcov.info exists
cat coverage/lcov.info | head
```

**Solution**:
1. Verify c8 is installed (`npm install --save-dev c8`)
2. Verify test:coverage script in package.json:
   ```json
   "test:coverage": "c8 --reporter=lcov --reporter=text -- npm test"
   ```
3. Run locally to verify: `npm run test:coverage`
4. Check coverage directory is created: `ls -la coverage/`

## Quick Reference

### SonarCloud Links

- **Dashboard**: https://sonarcloud.io/dashboard?id=guyinwonder168_opencode-glm-quota
- **Issues**: https://sonarcloud.io/project/issues?id=guyinwonder168_opencode-glm-quota
- **Measures**: https://sonarcloud.io/project/measures?id=guyinwonder168_opencode-glm-quota
- **Quality Gate**: https://sonarcloud.io/quality_gates/show?projectKey=guyinwonder168_opencode-glm-quota

### GitHub Links

- **Actions**: https://github.com/guyinwonder168/opencode-glm-quota/actions
- **Workflow**: https://github.com/guyinwonder168/opencode-glm-quota/blob/main/.github/workflows/ci-sonarcloud.yml
- **Branch**: https://github.com/guyinwonder168/opencode-glm-quota/tree/feature/slice-4.5-reset-time

### Documentation

- **SonarQube Docs**: https://docs.sonarsource.com/sonarqube-cloud/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Quality Gates**: https://docs.sonarsource.com/sonarqube/latest/user-guide/quality-gates/

## Version History

| Version | Date | Changes |
|---------|-------|---------|
| 1.0.0 | 2026-01-21 | Initial SonarCloud integration with official actions |
| | | |

---

**Related Resources**:
- `scripts/setup-sonarcloud.sh` - Automated setup script
- `docs/sonarcloud-mcp-guide.md` - SonarQube MCP tool usage guide
- `.github/workflows/ci-sonarcloud.yml` - GitHub Actions workflow
- `sonar-project.properties` - SonarCloud configuration
