# CI/CD Pipeline Workflow

<workflow>
  <name>CI/CD Pipeline</name>
  <purpose>Automated build, test, and deployment pipeline</purpose>
</workflow>

<orchestrator>@DevOpsOrchestrator</orchestrator>

<pipeline_stages>
  <stage id="1" name="Build">
    <jobs>
      <job id="1.1">
        <name>Install Dependencies</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Install language-specific dependencies</action>
          <action>Cache dependencies for faster builds</action>
        </actions>
        <tools>
          <tool>npm (Node.js/FE)</tool>
          <tool>pip (Python)</tool>
          <tool>pipenv (Python)</tool>
          <tool>gradle/maven (Java)</tool>
          <tool>go mod (Go)</tool>
        </tools>
      </job>

      <job id="1.2">
        <name>Build Application</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Build frontend code</action>
          <action>Build backend code</action>
          <action>Generate production bundles</action>
        </actions>
        <validation>Build succeeds with no errors</validation>
      </job>

      <job id="1.3">
        <name>Build Docker Image</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Build Docker/Containerfile</action>
          <action>Optimize image size</action>
          <action>Scan image for vulnerabilities</action>
        </actions>
        <validation>Image builds and scans pass</validation>
      </job>

      <job id="1.4">
        <name>Push to Registry</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Tag image appropriately</action>
          <action>Push to Docker Hub/GitLab Registry</action>
        </actions>
        <validation>Image successfully pushed</validation>
      </job>
    </jobs>
    <depends_on>None</depends_on>
  </stage>

  <stage id="2" name="Test">
    <jobs>
      <job id="2.1">
        <name>Run Unit Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run all unit tests</action>
          <action>Generate coverage report</action>
        </actions>
        <validation>All tests pass</validation>
        <coverage>
          <frontend>80% minimum</frontend>
          <backend>85% minimum</backend>
        </coverage>
      </job>

      <job id="2.2">
        <name>Run Integration Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run integration test suite</action>
          <action>Test database interactions</action>
          <action>Test API endpoints</action>
        </actions>
        <validation>All tests pass</validation>
      </job>

      <job id="2.3">
        <name>Run Linters</name>
        <agent>@CodeReviewer</agent>
        <actions>
          <action>Run language-specific linters</action>
          <action>Check code style and conventions</action>
        </actions>
        <validation>No blocking linting errors</validation>
        <tools>
          <tool>ESLint (JavaScript/TypeScript)</tool>
          <tool>Pylint (Python)</tool>
          <tool>Checkstyle (Java)</tool>
          <tool>golint (Go)</tool>
        </tools>
      </job>

      <job id="2.4">
        <name>SonarQube Analysis</name>
        <agent>@CodeReviewer</agent>
        <actions>
          <action>Run SonarQube scanner</action>
          <action>Generate quality metrics</action>
        </actions>
        <validation>Quality gate passes</validation>
        <metrics>
          <metric>Code smell rating: B or better</metric>
          <metric>Reliability rating: B or better</metric>
          <metric>Security rating: A</metric>
          <metric>Maintainability rating: B or better</metric>
        </metrics>
      </job>
    </jobs>
    <depends_on>Build</depends_on>
  </stage>

  <stage id="3" name="Deploy - Development">
    <trigger>Push to develop branch</trigger>
    <jobs>
      <job id="3.1">
        <name>Deploy to Dev</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Trigger deployment to dev environment</action>
          <action>Apply development configuration</action>
        </actions>
        <validation>Deployment successful</validation>
      </job>

      <job id="3.2">
        <name>Run Smoke Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run critical path tests</action>
          <action>Verify basic functionality</action>
        </actions>
        <validation>All smoke tests pass</validation>
      </job>
    </jobs>
    <depends_on>Test</depends_on>
  </stage>

  <stage id="4" name="Deploy - Staging">
    <trigger>Merged to staging branch or MR approval</trigger>
    <jobs>
      <job id="4.1">
        <name>Deploy to Staging</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Trigger deployment to staging environment</action>
          <action>Apply staging configuration</action>
        </actions>
        <validation>Deployment successful</validation>
      </job>

      <job id="4.2">
        <name>Run E2E Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run end-to-end test suite</action>
          <action>Test complete user workflows</action>
        </actions>
        <validation>All E2E tests pass</validation>
      </job>

      <job id="4.3">
        <name>Performance Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run load tests</action>
          <action>Measure response times and throughput</action>
        </actions>
        <validation>Performance meets requirements</validation>
      </job>
    </jobs>
    <depends_on>Test</depends_on>
  </stage>

  <stage id="5" name="Deploy - Production">
    <trigger>Merged to main/master branch, manual approval required</trigger>
    <jobs>
      <job id="5.1">
        <name>Manual Approval</name>
        <agent>@Software-DevOrchestrator</agent>
        <actions>
          <action>Request human approval for production deployment</action>
          <action>Verify all validation gates passed</action>
        </actions>
        <validation>Approved by authorized user</validation>
      </job>

      <job id="5.2">
        <name>Deploy to Production</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Trigger deployment to production</action>
          <action>Apply production configuration</action>
          <action>Execute database migrations if needed</action>
        </actions>
        <validation>Deployment successful</validation>
      </job>

      <job id="5.3">
        <name>Run Health Checks</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Verify application is responding</action>
          <action>Check database connections</action>
          <action>Verify API endpoints</action>
        </actions>
        <validation>All health checks pass</validation>
      </job>

      <job id="5.4">
        <name>Run Smoke Tests</name>
        <agent>@TestArchitect</agent>
        <actions>
          <action>Run critical path tests in production</action>
          <action>Verify basic user flows work</action>
        </actions>
        <validation>All smoke tests pass</validation>
      </job>

      <job id="5.5">
        <name>Monitor Post-Deployment</name>
        <agent>@DevOpsOrchestrator</agent>
        <actions>
          <action>Monitor error rates</action>
          <action>Monitor response times</action>
          <action>Check system metrics</action>
          <action>Set up alerts for anomalies</action>
        </actions>
        <duration>24-48 hours</duration>
        <validation>System stable, no critical errors</validation>
      </job>
    </jobs>
    <depends_on>Staging</depends_on>
  </stage>
</pipeline_stages>

<quality_gates>
  <gate id="1">
    <name>Build Gate</name>
    <criteria>
      <criterion>Build succeeds with no errors</criterion>
      <criterion>Docker image builds</criterion>
      <criterion>Vulnerability scan passes (no critical/high)</criterion>
    </criteria>
    <action_on_fail>Stop pipeline, notify team</action_on_fail>
  </gate>

  <gate id="2">
    <name>Test Gate</name>
    <criteria>
      <criterion>All unit tests pass</criterion>
      <criterion>Test coverage >= thresholds (FE: 80%, BE: 85%)</criterion>
      <criterion>Integration tests pass</criterion>
      <criterion>No blocking linting errors</criterion>
      <criterion>SonarQube quality gate passes</criterion>
    </criteria>
    <action_on_fail>Stop pipeline, notify team, block deployment</action_on_fail>
  </gate>

  <gate id="3">
    <name>Dev Deployment Gate</name>
    <criteria>
      <criterion>Deployment to dev successful</criterion>
      <criterion>Smoke tests pass</criterion>
    </criteria>
    <action_on_fail>Stop pipeline, notify team</action_on_fail>
  </gate>

  <gate id="4">
    <name>Staging Deployment Gate</name>
    <criteria>
      <criterion>Deployment to staging successful</criterion>
      <criterion>E2E tests pass</criterion>
      <criterion>Performance tests pass</criterion>
      <criterion>Stakeholder approval (optional)</criterion>
    </criteria>
    <action_on_fail>Stop pipeline, notify team, block production deployment</action_on_fail>
  </gate>

  <gate id="5">
    <name>Production Deployment Gate</name>
    <criteria>
      <criterion>Manual approval received</criterion>
      <criterion>Deployment successful</criterion>
      <criterion>Health checks pass</criterion>
      <criterion>Smoke tests pass</criterion>
    </criteria>
    <action_on_fail>Trigger rollback, notify team, investigate issue</action_on_fail>
  </gate>
</quality_gates>

<notifications>
  <event>Pipeline started</event>
    <channel>Slack, Teams, Email</channel>
    <message>CI/CD pipeline started for [branch]</message>
  </event>

  <event>Build failed</event>
    <channel>Slack, Teams, Email</channel>
    <priority>High</priority>
    <message>Build failed for [branch]: [error]</message>
  </event>

  <event>Tests failed</event>
    <channel>Slack, Teams, Email</channel>
    <priority>High</priority>
    <message>Tests failed for [branch]: [failure details]</message>
  </event>

  <event>Deployment successful</event>
    <channel>Slack, Teams, Email</channel>
    <priority>Normal</priority>
    <message>Deployed [version] to [environment] successfully</message>
  </event>

  <event>Production deployment ready</event>
    <channel>Slack, Teams, Email</channel>
    <priority>Normal</priority>
    <message>Production deployment requires approval. Click to approve: [link]</message>
  </event>
</notifications>

<rollback_procedures>
  <trigger>Deployment fails, health checks fail, critical errors in production</trigger>
  <steps>
    <step>Identify last stable version</step>
    <step>Roll back to previous image tag</step>
    <step>Roll back database migrations if needed</step>
    <step>Verify health checks</step>
    <step>Run smoke tests</step>
    <step>Monitor system for 1-2 hours</step>
  </steps>
  <agent>@DevOpsOrchestrator</agent>
  <automation>Semi-automated (may require manual intervention)</automation>
</rollback_procedures>

<supported_platforms>
  <platform name="GitHub Actions">
    <config_file>.github/workflows/ci-cd.yml</config_file>
    <triggers>push, pull_request, manual, schedule</triggers>
  </platform>

  <platform name="GitLab CI">
    <config_file>.gitlab-ci.yml</config_file>
    <triggers>push, merge_request, manual, schedule</triggers>
  </platform>
</supported_platforms>

<environment_variables>
  <variable name="DATABASE_URL">
    <scope>Development, Staging, Production</scope>
    <type>Secret</type>
  </variable>

  <variable name="API_KEYS">
    <scope>Development, Staging, Production</scope>
    <type>Secret</type>
  </variable>

  <variable name="DOCKER_REGISTRY">
    <scope>Global</scope>
    <type>Variable</type>
  </variable>

  <variable name="ENVIRONMENT">
    <scope>Per job</scope>
    <type>Variable</type>
    <values>development, staging, production</values>
  </variable>
</environment_variables>

<monitoring>
  <metrics>
    <metric>Build success rate</metric>
    <metric>Test pass rate</metric>
    <metric>Test coverage</metric>
    <metric>Deployment frequency</metric>
    <metric>Deployment success rate</metric>
    <metric>Rollback frequency</metric>
  </metrics>

  <alerts>
    <alert>Build failure</alert>
      <condition>Build fails on main branch</condition>
      <severity>High</severity>
    </alert>

    <alert>Test failure</alert>
      <condition>Tests fail on main branch</condition>
      <severity>High</severity>
    </alert>

    <alert>Production deployment failure</alert>
      <condition>Production deployment fails</condition>
      <severity>Critical</severity>
    </alert>

    <alert>High error rate</alert>
      <condition>Error rate > threshold in production</condition>
      <severity>Critical</severity>
    </alert>
  </alerts>
</monitoring>
