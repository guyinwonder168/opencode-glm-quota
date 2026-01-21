# Complete Feature Development Workflow

<workflow>
  <name>Complete Feature Development</name>
  <purpose>End-to-end workflow from brainstorming to deployment following SLICE and TDD methodologies</purpose>
</workflow>

<orchestrator>@Software-DevOrchestrator</orchestrator>

<phases>
  <phase id="1">
    <name>Brainstorming & Requirements</name>
    <agent>@DesignArchitect</agent>
    <context_level>Level 2</context_level>
    <tasks>
      <task>Conduct brainstorming session</task>
      <task>Create PRD (Product Requirements Document)</task>
      <task>Create SDD (System Design Document)</task>
      <task>Create SRS (Software Requirements Specification)</task>
      <task>Validate requirements with stakeholders</task>
    </tasks>
    <deliverables>
      <deliverable>Brainstorming session report</deliverable>
      <deliverable>PRD document</deliverable>
      <deliverable>SDD document</deliverable>
      <deliverable>SRS document</deliverable>
    </deliverables>
    <validation>
      <check>Requirements are clear and complete</check>
      <check>Stakeholders agree on scope</check>
      <check>Technical feasibility confirmed</check>
    </validation>
  </phase>

  <phase id="2">
    <name>Implementation Planning</name>
    <agent>@ImplementationPlanner</agent>
    <context_level>Level 2</context_level>
    <tasks>
      <task>Review design documents (PRD, SDD, SRS)</task>
      <task>Apply SLICE methodology - Scope phase</task>
      <task>Apply SLICE methodology - Learn phase</task>
      <task>Apply SLICE methodology - Identify phase</task>
      <task>Create detailed implementation plan</task>
      <task>Define tasks, dependencies, and timeline</task>
    </tasks>
    <deliverables>
      <deliverable>Implementation plan document</deliverable>
      <deliverable>Task breakdown with estimates</deliverable>
      <deliverable>Dependency graph</deliverable>
      <deliverable>Timeline and milestones</deliverable>
    </deliverables>
    <validation>
      <check>Plan follows SLICE methodology completely</check>
      <check>All tasks are defined and estimable</check>
      <check>Dependencies are accurate</check>
      <check>Milestones are measurable</check>
    </validation>
  </phase>

  <phase id="3">
    <name>Test Architecture (TDD)</name>
    <agent>@TestArchitect</agent>
    <context_level>Level 1 (per task)</context_level>
    <tasks>
      <task>Write failing tests for each behavior (TDD principle)</task>
      <task>Ensure tests follow naming conventions</task>
      <task>Create test fixtures and data</task>
      <task>Set up test framework and configuration</task>
    </tasks>
    <deliverables>
      <deliverable>Test suite (all tests failing initially)</deliverable>
      <deliverable>Test fixtures and data</deliverable>
      <deliverable>Test configuration</deliverable>
    </deliverables>
    <validation>
      <check>All tests are written BEFORE code</check>
      <check>Tests are descriptive and focused</check>
      <check>Tests are independent</check>
    </validation>
  </phase>

  <phase id="4">
    <name>Code Generation</name>
    <agents>
      <agent>@FrontendCodeGenerator (frontend components)</agent>
      <agent>@BackendCodeGenerator (backend services/APIs)</agent>
    </agents>
    <context_level>Level 1 (per task)</context_level>
    <tasks>
      <task>Implement code to make tests pass (TDD principle)</task>
      <task>Generate frontend components following framework patterns</task>
      <task>Generate backend services and APIs</task>
      <task>Implement data models and migrations</task>
      <task>Apply code quality standards</task>
    </tasks>
    <deliverables>
      <deliverable>Frontend component implementations</deliverable>
      <deliverable>Backend service implementations</deliverable>
      <deliverable>Database migrations</deliverable>
      <deliverable>API endpoint implementations</deliverable>
      <deliverable>Integration implementations</deliverable>
    </deliverables>
    <validation>
      <check>All tests pass</check>
      <check>Code follows framework conventions</check>
      <check>Code meets quality standards</check>
    </validation>
  </phase>

  <phase id="5">
    <name>Code Review</name>
    <agent>@CodeReviewer</agent>
    <context_level>Level 2</context_level>
    <tasks>
      <task>Automated checks (linters, SonarQube)</task>
      <task>Review correctness and logic</task>
      <task>Review security aspects</task>
      <task>Review performance implications</task>
      <task>Review maintainability and readability</task>
      <task>Review test coverage</task>
      <task>Generate review report with feedback</task>
    </tasks>
    <deliverables>
      <deliverable>Code review report</deliverable>
      <deliverable>Feedback and recommendations</deliverable>
      <deliverable>Quality metrics (SonarQube ratings)</deliverable>
    </deliverables>
    <validation>
      <check>Automated checks pass</check>
      <check>No critical security issues</check>
      <check>No blocking issues</check>
      <check>Code meets quality standards</check>
    </validation>
  </phase>

  <phase id="6">
    <name>Feedback & Refinement</name>
    <agents>
      <agent>@FrontendCodeGenerator (if FE fixes needed)</agent>
      <agent>@BackendCodeGenerator (if BE fixes needed)</agent>
      <agent>@TestArchitect (if new tests needed)</agent>
    </agents>
    <context_level>Level 1 (per task)</context_level>
    <tasks>
      <task>Address code review feedback</task>
      <task>Fix issues and bugs</task>
      <task>Refactor code if needed</task>
      <task>Add additional tests if needed</task>
      <task>Ensure all tests pass</task>
    </tasks>
    <deliverables>
      <deliverable>Updated code with fixes</deliverable>
      <deliverable>Updated tests</deliverable>
      <deliverable>Feedback resolution report</deliverable>
    </deliverables>
    <validation>
      <check>All review feedback addressed</check>
      <check>Tests pass</check>
      <check>Code quality improved</check>
    </validation>
  </phase>

  <phase id="7">
    <name>Documentation Generation</name>
    <agent>@TechnicalWriter</agent>
    <context_level>Level 2</context_level>
    <tasks>
      <task>Generate API documentation (if applicable)</task>
      <task>Update README files</task>
      <task>Create/update user guides</task>
      <task>Update CHANGELOG</task>
      <task>Document architecture decisions</task>
    </tasks>
    <deliverables>
      <deliverable>API documentation (Swagger/OpenAPI)</deliverable>
      <deliverable>Updated README</deliverable>
      <deliverable>User guides (if needed)</deliverable>
      <deliverable>Updated CHANGELOG</deliverable>
      <deliverable>Architecture documentation</deliverable>
    </deliverables>
    <validation>
      <check>Documentation is clear and complete</check>
      <check>API documentation matches implementation</check>
      <check>README is up to date</check>
    </validation>
  </phase>

  <phase id="8">
    <name>Deployment</name>
    <agent>@DevOpsOrchestrator</agent>
    <context_level>Level 2</context_level>
    <tasks>
      <task>Prepare deployment configuration</task>
      <task>Trigger CI/CD pipeline</task>
      <task>Deploy to test environment</task>
      <task>Run health checks</task>
      <task>Run smoke tests</task>
      <task>Deploy to staging (if applicable)</task>
      <task>Deploy to production (approved only)</task>
      <task>Monitor post-deployment</task>
    </tasks>
    <deliverables>
      <deliverable>CI/CD pipeline configuration</deliverable>
      <deliverable>Deployment scripts</deliverable>
      <deliverable>Environment configurations</deliverable>
      <deliverable>Deployment report</deliverable>
    </deliverables>
    <validation>
      <check>CI/CD pipeline passes</check>
      <check>Deployment successful</check>
      <check>Health checks pass</check>
      <check>Smoke tests pass</check>
      <check>System stable post-deployment</check>
    </validation>
  </phase>
</phases>

<validation_gates>
  <gate phase="1">
    <name>Requirements Validation</name>
    <check>PRD, SDD, SRS documents created</check>
    <check>Stakeholders approve requirements</check>
  </gate>

  <gate phase="2">
    <name>Plan Validation</name>
    <check>Implementation plan follows SLICE methodology</check>
    <check>Plan is approved and agreed upon</check>
  </gate>

  <gate phase="3-4">
    <name>Test and Code Validation</name>
    <check>Tests written BEFORE code (TDD compliance)</check>
    <check>All tests pass</check>
    <check>Code meets quality standards</check>
  </gate>

  <gate phase="5">
    <name>Code Review Validation</name>
    <check>No critical or blocking issues</check>
    <check>All major issues addressed</check>
    <check>Code review approved</check>
  </gate>

  <gate phase="6">
    <name>Refinement Validation</name>
    <check>All feedback addressed</check>
    <check>Tests still pass</check>
  </gate>

  <gate phase="7">
    <name>Documentation Validation</name>
    <check>Documentation is complete and accurate</check>
    <check>Ready for merge (MR/PR)</check>
  </gate>

  <gate phase="8">
    <name>Deployment Validation</name>
    <check>CI/CD pipeline passes all stages</check>
    <check>Deployment successful</check>
    <check>Health checks pass</check>
  </gate>
</validation_gates>

<full_history_tracking>
  <enabled>true</enabled>
  <storage>.opencode/history/{project-id}/</storage>
  <content>
    <item>Brainstorming sessions and decisions</item>
    <item>All requirement documents (PRD, SDD, SRS)</item>
    <item>Implementation plans and task breakdowns</item>
    <item>Test suites and results</item>
    <item>Code reviews and feedback</item>
    <item>Deployment configurations and outcomes</item>
    <item>Documentation versions</item>
    <item>Learnings and patterns discovered</item>
  </content>
</full_history_tracking>

<rollback_procedures>
  <trigger>Deployment fails or critical issues in production</trigger>
  <steps>
    <step>Identify last stable version</step>
    <step>Roll back code to previous version</step>
    <step>Roll back database migrations if needed</step>
    <step>Verify health checks</step>
    <step>Run smoke tests</step>
    <step>Monitor system stability</step>
  </steps>
</rollback_procedures>

<success_criteria>
  <criterion>All validation gates passed</criterion>
  <criterion>Feature works as specified in PRD</criterion>
  <criterion>Tests pass with adequate coverage</criterion>
  <criterion>Code review approved</criterion>
  <criterion>Documentation complete</criterion>
  <criterion>Deployment successful and stable</criterion>
</success_criteria>

<estimated_duration>
  <depends_on>Complexity and scope</depends_on>
  <ranges>
    <range>Simple feature: 1-2 weeks</range>
    <range>Medium feature: 2-4 weeks</range>
    <range>Complex feature: 4-8+ weeks</range>
  </ranges>
</estimated_duration>
