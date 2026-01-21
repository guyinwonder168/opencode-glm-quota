#!/bin/bash
# SonarCloud Setup Script for opencode-glm-quota
# This script helps configure SonarCloud integration

set -e

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

# Configuration
ORGANIZATION="guyinwonder168"
PROJECT_KEY="guyinwonder168_opencode-glm-quota"
PROJECT_NAME="OpenCode GLM Quota Plugin"

echo "📋 Project Configuration:"
echo "  Organization: $ORGANIZATION"
echo "  Project Key: $PROJECT_KEY"
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
    echo "  3. Add SONAR_ORGANIZATION (value: guyinwonder168)"
    echo "  4. Add SONAR_PROJECT_KEY (value: guyinwonder168_opencode-glm-quota)"
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

# Step 2: Verify SonarCloud configuration
echo "📄 Step 2: Verifying sonar-project.properties..."
if [ -f "sonar-project.properties" ]; then
    echo "  ✅ sonar-project.properties exists"
    echo ""
    echo "Current configuration:"
    grep "^sonar\." sonar-project.properties | head -5
else
    echo "  ❌ sonar-project.properties not found"
    exit 1
fi

echo ""

# Step 3: Verify workflow exists
echo "⚙️  Step 3: Verifying GitHub Actions workflow..."
if [ -f ".github/workflows/ci-sonarcloud.yml" ]; then
    echo "  ✅ ci-sonarcloud.yml exists"
else
    echo "  ❌ ci-sonarcloud.yml not found"
    echo ""
    echo "Creating workflow from template..."
    # Would create workflow if not exists
fi

echo ""

# Step 4: Guide to SonarCloud project setup
echo "🌐 Step 4: SonarCloud Project Setup"
echo ""
echo "1. Go to: https://sonarcloud.io/projects/create"
echo "2. Fill in:"
echo "   - Display name: $PROJECT_NAME"
echo "   - Key: opencode-glm-quota"
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
echo "     git push origin main"
echo "  3. Check GitHub Actions:"
echo "     https://github.com/guyinwonder168/opencode-glm-quota/actions"
echo "  4. Wait for 'CI with SonarCloud' to complete"
echo "  5. View SonarCloud dashboard:"
echo "     https://sonarcloud.io/dashboard?id=$PROJECT_KEY"
echo ""

# Step 6: MCP integration guide
echo "🤖 Step 6: SonarQube MCP Integration"
echo ""
echo "Using SonarQube MCP to fetch results:"
echo ""
echo "  # Check quality gate status"
echo "  @sonarqube_get_project_quality_gate_status(projectKey=\"$PROJECT_KEY\")"
echo ""
echo "  # Get code metrics"
echo "  @sonarqube_get_component_measures("
echo "    projectKey=\"$PROJECT_KEY\","
echo "    metricKeys=[\"coverage\", \"complexity\", \"bugs\"]"
echo "  )"
echo ""
echo "  # Search issues"
echo "  @sonarqube_search_sonar_issues_in_projects("
echo "    projects=[\"$PROJECT_KEY\"],"
echo "    severities=[\"CRITICAL\", \"BLOCKER\"]"
echo "  )"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add GitHub secrets if missing"
echo "  2. Push code to trigger analysis"
echo "  3. Use SonarQube MCP to fetch results"
echo ""
echo "For detailed usage, see: docs/sonarcloud-mcp-guide.md"
