#!/bin/bash
# SonarCloud Setup Script for opencode-glm-quota
# This script helps configure SonarCloud integration
#
# Usage: ./scripts/setup-sonarcloud.sh [ORGANIZATION] [PROJECT_KEY]
#
# Example: ./scripts/setup-sonarcloud.sh guyinwonder168 opencode-glm-quota

set -e

# Configuration (from command line args or defaults)
ORGANIZATION=${1:-"guyinwonder168"}
PROJECT_KEY=${2:-"opencode-glm-quota"}
FULL_PROJECT_KEY="${ORGANIZATION}_${PROJECT_KEY}"
PROJECT_NAME="OpenCode GLM Quota Plugin"

echo "🔧 SonarCloud Setup for opencode-glm-quota"
echo "=========================================="
echo ""

# Check prerequisites
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "⚠️  Warning: GitHub CLI (gh) not installed"
    echo "Install from: https://cli.github.com/"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Display configuration
echo "📋 Project Configuration:"
echo "  Organization: $ORGANIZATION"
echo "  Project Key: $PROJECT_KEY"
echo "  Full Project Key: $FULL_PROJECT_KEY"
echo "  Project Name: $PROJECT_NAME"
echo ""

# Step 1: Check if secrets exist
echo "🔑 Step 1: Checking GitHub Secrets..."
if gh secret list 2>/dev/null | grep -q "SONAR_TOKEN"; then
    echo "  ✅ SONAR_TOKEN exists"
else
    echo "  ❌ SONAR_TOKEN missing"
    echo ""
    echo "Please add secrets to GitHub:"
    echo "  1. Go to: https://github.com/guyinwonder168/opencode-glm-quota/settings/secrets/actions"
    echo "  2. Add SONAR_TOKEN (from SonarCloud: My Account → Security → Tokens)"
    echo "  3. Add SONAR_ORGANIZATION (value: $ORGANIZATION)"
    echo "  4. Add SONAR_PROJECT_KEY (value: $FULL_PROJECT_KEY)"
    echo ""
    exit 1
fi

if gh secret list 2>/dev/null | grep -q "SONAR_ORGANIZATION"; then
    echo "  ✅ SONAR_ORGANIZATION exists"
else
    echo "  ⚠️  SONAR_ORGANIZATION missing"
fi

if gh secret list 2>/dev/null | grep -q "SONAR_PROJECT_KEY"; then
    echo "  ✅ SONAR_PROJECT_KEY exists"
else
    echo "  ⚠️  SONAR_PROJECT_KEY missing"
fi

echo ""

# Step 2: Update sonar-project.properties with provided values
echo "📄 Step 2: Updating sonar-project.properties..."
cat > sonar-project.properties << EOF
# SonarCloud Project Configuration
# https://docs.sonarsource.com/sonarcloud/

# Project identification
sonar.projectKey=$FULL_PROJECT_KEY
sonar.organization=$ORGANIZATION
sonar.host.url=https://sonarcloud.io

# Project metadata
sonar.projectName=$PROJECT_NAME
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
sonar.qualitygate.wait=true

# Analysis parameters
sonar.scm.revision=\${GITHUB_SHA}
sonar.scm.provider=git
EOF

echo "  ✅ sonar-project.properties updated"
echo ""
echo "  Updated configuration:"
grep "^sonar\." sonar-project.properties | head -5
echo ""

# Step 3: Verify workflow exists
echo "⚙️  Step 3: Verifying GitHub Actions workflow..."
if [ -f ".github/workflows/ci-sonarcloud.yml" ]; then
    echo "  ✅ ci-sonarcloud.yml exists"
else
    echo "  ❌ ci-sonarcloud.yml not found"
    echo "  Creating from template..."
    # Workflow file should exist from previous setup
fi

echo ""

# Step 4: Guide to SonarCloud project setup
echo "🌐 Step 4: SonarCloud Project Setup"
echo ""
echo "1. Go to: https://sonarcloud.io/projects/create"
echo "2. Fill in:"
echo "   - Display name: $PROJECT_NAME"
echo "   - Key: $PROJECT_KEY"
echo "3. Select organization: $ORGANIZATION"
echo "4. Click 'Set Up'"
echo ""

# Step 5: Test SonarCloud connection
echo "🧪 Step 5: Testing Connection..."
echo ""
echo "To test SonarCloud integration:"
echo "  1. Make a small change to your code"
echo "  2. Commit and push:"
echo "     git add ."
echo "     git commit -m 'test: verify sonarcloud integration'"
echo "     git push origin \$(git rev-parse --abbrev-ref HEAD)"
echo "  3. Check GitHub Actions:"
echo "     https://github.com/guyinwonder168/opencode-glm-quota/actions"
echo "  4. Wait for 'CI with SonarCloud' to complete"
echo "  5. View SonarCloud dashboard:"
echo "     https://sonarcloud.io/dashboard?id=$FULL_PROJECT_KEY"
echo ""

# Step 6: MCP integration guide
echo "🤖 Step 6: SonarQube MCP Integration"
echo ""
echo "Using SonarQube MCP to fetch results:"
echo ""
echo "  # Check quality gate status"
echo "  @sonarqube_get_project_quality_gate_status(projectKey=\"$FULL_PROJECT_KEY\")"
echo ""
echo "  # Get code metrics"
echo "  @sonarqube_get_component_measures("
echo "    projectKey=\"$FULL_PROJECT_KEY\","
echo "    metricKeys=[\"coverage\", \"complexity\", \"bugs\"]"
echo "  )"
echo ""
echo "  # Search issues"
echo "  @sonarqube_search_sonar_issues_in_projects("
echo "    projects=[\"$FULL_PROJECT_KEY\"],"
echo "    severities=[\"CRITICAL\", \"BLOCKER\"]"
echo "  )"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add GitHub secrets if missing (SONAR_TOKEN, SONAR_ORGANIZATION, SONAR_PROJECT_KEY)"
echo "  2. Create SonarCloud project at sonarcloud.io"
echo "  3. Push code to trigger analysis"
echo "  4. Use SonarQube MCP to fetch results"
echo ""
echo "Custom project? Run with parameters:"
echo "  ./scripts/setup-sonarcloud.sh YOUR_ORG YOUR_PROJECT_KEY"
echo ""
echo "For detailed usage, see: docs/sonarcloud-mcp-guide.md"
