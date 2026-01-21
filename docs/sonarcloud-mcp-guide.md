# SonarCloud MCP Integration Guide

This guide shows how to use SonarQube MCP tool to fetch SonarCloud analysis results for your GLM Quota Plugin.

## Prerequisites

1. ✅ SonarCloud project registered
2. ✅ GitHub Actions workflow configured (`.github/workflows/ci-sonarcloud.yml`)
3. ✅ Secrets added to GitHub (SONAR_TOKEN, SONAR_ORGANIZATION, SONAR_PROJECT_KEY)
4. ✅ SonarQube MCP tool available in your environment

## Project Configuration

**SonarCloud Project:**
- **Organization**: `guyinwonder168`
- **Project Key**: `guyinwonder168_opencode-glm-quota`
- **Host**: `https://sonarcloud.io`

## Common MCP Queries

### 1. Get Project Quality Gate Status

Check if code passes quality gate before merging:

```bash
# Using OpenCode with SonarQube MCP
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")
```

**Expected Output:**
- Status: OK / WARN / ERROR
- Conditions list (coverage threshold, code smell, bugs, vulnerabilities)
- Timestamp of analysis

### 2. Get Code Metrics

Fetch coverage, complexity, duplications:

```bash
@sonarqube_get_component_measures(
  projectKey="guyinwonder168_opencode-glm-quota",
  metricKeys=["coverage", "complexity", "duplicated_lines_density", "bugs", "vulnerabilities", "code_smells"]
)
```

**Available Metrics:**
- `coverage` - Test coverage percentage
- `complexity` - Cyclomatic complexity
- `duplicated_lines_density` - Code duplication %
- `bugs` - Bug count
- `vulnerabilities` - Security vulnerabilities
- `code_smells` - Code smell count
- `sqale_index` - Technical debt in minutes

### 3. Search Code Issues

Find specific issues in your code:

```bash
# Find all issues in project
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["BLOCKER", "CRITICAL", "MAJOR"],
  types=["BUG", "VULNERABILITY", "CODE_SMELL"]
)

# Filter by specific severity
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["CRITICAL"]
)
```

**Issue Filters:**
- `severities`: BLOCKER, CRITICAL, MAJOR, MINOR, INFO
- `types`: BUG, VULNERABILITY, CODE_SMELL
- `statuses`: OPEN, CONFIRMED, REOPENED, CLOSED
- `resolutions`: FIXED, FALSE-POSITIVE, WONTFIX

### 4. Analyze Code Snippet

Analyze a specific function or code block:

```bash
@sonarqube_analyze_code_snippet(
  projectKey="guyinwonder168_opencode-glm-quota",
  language="typescript",
  codeSnippet=`function formatTimeUntilReset(resetTime: number | null | undefined): string {
  // implementation
}`
)
```

### 5. List All Projects

Verify your project exists:

```bash
@sonarqube_list_enterprises()
```

### 6. Check Issue Details

Get details about a specific rule violation:

```bash
@sonarqube_show_rule(key="typescript:S1135")
```

## Pre-Merge Workflow

Before merging `feature/slice-4.5-reset-time` to main:

### 1. Push to Feature Branch
```bash
git checkout feature/slice-4.5-reset-time
git push origin feature/slice-4.5-reset-time
```

### 2. GitHub Actions Runs SonarCloud

Wait for GitHub Actions CI to complete:
- Check: https://github.com/guyinwonder168/opencode-glm-quota/actions
- Wait for: "CI with SonarCloud" workflow to finish

### 3. Fetch Quality Gate Status

```bash
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")
```

**Check for:**
- ✅ **OK** - All quality gate conditions passed
- ⚠️ **WARN** - Some conditions failed but not blocking
- ❌ **ERROR** - Quality gate failed, DO NOT MERGE

### 4. Get Detailed Metrics

```bash
@sonarqube_get_component_measures(
  projectKey="guyinwonder168_opencode-glm-quota",
  metricKeys=["coverage", "complexity", "duplicated_lines_density", "bugs", "vulnerabilities", "code_smells", "sqale_index"]
)
```

**Verify:**
- Coverage ≥ 85% (target threshold)
- Complexity is reasonable
- No critical bugs or vulnerabilities

### 5. Review Critical Issues

```bash
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["BLOCKER", "CRITICAL"]
)
```

**Action:** Fix all BLOCKER and CRITICAL issues before merge.

### 6. Create PR

After quality gate passes:

```bash
gh pr create --base main --head feature/slice-4.5-reset-time --title "feat: add next reset time countdown display" --body "## Summary\n\nAdds next reset time countdown to GLM quota plugin.\n\n## Quality Gate\n\n✅ Status: OK\n✅ Coverage: 85%+\n✅ No critical issues\n\n## Changes\n\nSee commit log for details."
```

### 7. PR Auto-Check

GitHub Actions will run SonarCloud again on PR:
- Quality gate status appears as PR comment
- You can verify: "Quality gate passed" ✅

## Example Query Flow

### Before Merging Slice 4.5:

```bash
# 1. Check quality gate
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")

# Output:
# Status: OK
# Conditions: coverage=87.5% [OK], bugs=0 [OK], vulnerabilities=0 [OK]

# 2. Get detailed metrics
@sonarqube_get_component_measures(
  projectKey="guyinwonder168_opencode-glm-quota",
  metricKeys=["coverage", "complexity", "sqale_index"]
)

# Output:
# coverage: 87.5%
# complexity: 45
# sqale_index: 25 minutes

# 3. Check for issues
@sonarqube_search_sonar_issues_in_projects(
  projects=["guyinwonder168_opencode-glm-quota"],
  severities=["CRITICAL", "MAJOR"]
)

# Output:
# No issues found ✅

# 4. Safe to merge! 🎉
```

## Quality Gate Conditions

This project enforces:

| Metric | Threshold | Description |
|---------|-----------|-------------|
| Coverage | ≥ 85% | Test coverage must be 85% or higher |
| Bugs | 0 | Zero blocker/critical bugs allowed |
| Vulnerabilities | 0 | Zero blocker/critical vulnerabilities allowed |
| Code Smells | < 10 | Limit code smells for maintainability |
| Duplications | < 5% | Less than 5% code duplication |

## Troubleshooting

### Issue: "Project not found"

**Cause:** Wrong project key or organization

**Fix:**
```bash
# List all projects to verify
@sonarqube_search_my_sonarqube_projects()

# Check project key matches: guyinwonder168_opencode-glm-quota
```

### Issue: "Quality gate failed"

**Cause:** One or more conditions below threshold

**Fix:**
```bash
# Get failed conditions
@sonarqube_get_project_quality_gate_status(projectKey="guyinwonder168_opencode-glm-quota")

# Check which condition failed (coverage < 85%, etc.)
# Fix code and re-push
```

### Issue: "No analysis results"

**Cause:** GitHub Actions hasn't completed yet

**Fix:**
1. Wait for GitHub Actions to finish
2. Check https://sonarcloud.io/dashboard?id=guyinwonder168_opencode-glm-quota
3. Verify latest analysis completed successfully

## SonarCloud Dashboard

View full analysis results:
- **Dashboard**: https://sonarcloud.io/dashboard?id=guyinwonder168_opencode-glm-quota
- **Issues**: https://sonarcloud.io/project/issues?id=guyinwonder168_opencode-glm-quota
- **Measures**: https://sonarcloud.io/project/measures?id=guyinwonder168_opencode-glm-quota

## Links

- SonarCloud: https://sonarcloud.io
- SonarQube Documentation: https://docs.sonarsource.com/sonarqube/latest/
- MCP Tool Docs: (See SonarQube MCP tool documentation)
- GitHub Actions: https://github.com/guyinwonder168/opencode-glm-quota/actions
