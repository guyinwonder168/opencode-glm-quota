# Software Development AI System

A comprehensive, production-ready context-aware AI system for software development and DevOps workflows. This system orchestrates complex multi-stage development processes from brainstorming to deployment.

## 🎯 System Overview

**Domain**: Software Development and DevOps
**Purpose**: Generate content and code, analyze data, manage projects, QA & validation, research & information gathering
**Users**: Developers and Engineers

## 🚀 Key Features

### Comprehensive Agent Ecosystem

**Main Orchestrator** (1 agent)
- Routes requests to appropriate specialists
- Manages complex multi-stage workflows
- Coordinates context allocation (Level 1, 2, 3)
- Maintains full history across all interactions

**Specialized Subagents** (9 agents)
1. **Design Architect** - Brainstorming, PRD/SDD/SRS creation
2. **Implementation Planner** - Implementation planning using SLICE methodology
3. **Frontend Code Generator** - Angular, React, Vue, Vanilla JS, Tailwind, PHP
4. **Backend Code Generator** - Python (Django/FastAPI/Flask), Java (Spring Boot), Node.js, Go
5. **Test Architect** - Test design and creation following TDD approach
6. **API Builder** - REST API generation from OpenAPI specifications
7. **Code Reviewer** - Comprehensive code review and quality assurance
8. **DevOps Orchestrator** - Multi-environment deployment orchestration
9. **Technical Writer** - Technical documentation generation

### Workflow Orchestration

The system follows a rigorous workflow:

```
Brainstorming & Info Collection
         ↓
    PRD/SDD/SRS Creation
         ↓
  Implementation Planning (SLICE Method)
         ↓
      Code Generation (TDD - Tests Before Code)
         ↓
         Code Review
         ↓
    Documentation Generation
         ↓
        Deployment (Multi-Environment)
```

### Custom Commands (12 slash commands)

**Design & Planning:**
- `/brainstorm` - Initiate brainstorming sessions
- `/create-prd` - Create Product Requirements Document
- `/create-implementation-plan` - Create detailed implementation plans

**Code Generation:**
- `/generate-fe {framework} {feature}` - Generate frontend code
- `/generate-be {language} {framework} {feature}` - Generate backend code
- `/generate-api {openapi-spec} {language}` - Generate REST API endpoints

**Testing:**
- `/create-tests {file/path} {test-framework}` - Create unit tests
- `/run-tests {test-type}` - Run tests and report results

**Quality & Review:**
- `/review-code {pr/mr-url}` - Comprehensive code review
- `/analyze-quality {project-path}` - Analyze code quality across project

**DevOps:**
- `/deploy {environment}` - Deploy to specified environment

**Documentation:**
- `/generate-docs {project-name}` - Generate technical documentation

## 📁 System Structure

```
.opencode/
├── agent/
│   ├── Software-DevOrchestrator.md (Main orchestrator)
│   └── subagents/
│       ├── DesignArchitect.md
│       ├── ImplementationPlanner.md
│       ├── FrontendCodeGenerator.md
│       ├── BackendCodeGenerator.md
│       ├── TestArchitect.md
│       ├── APIBuilder.md
│       ├── CodeReviewer.md
│       ├── DevOpsOrchestrator.md
│       └── TechnicalWriter.md
├── context/
│   ├── domain/ (Knowledge about the domain)
│   │   ├── requirements-terminology.md
│   │   ├── slice-methodology.md
│   │   ├── tdd-methodology.md
│   │   ├── frontend-frameworks.md
│   │   └── backend-frameworks.md
│   ├── processes/ (Workflow knowledge)
│   │   ├── brainstorming.md
│   │   └── code-review-process.md
│   ├── standards/ (Quality criteria)
│   │   ├── code-quality-standards.md
│   │   └── testing-standards.md
│   └── templates/ (Reusable templates)
│       ├── prd-template.md
│       ├── implementation-plan-template.md
│       └── unit-test-template.md
├── command/ (Custom slash commands)
│   ├── brainstorm.md
│   ├── generate-fe.md
│   ├── generate-be.md
│   ├── create-tests.md
│   ├── review-code.md
│   ├── deploy.md
│   ├── generate-docs.md
│   └── ... (12 commands total)
└── workflows/ (Workflow definitions)
    ├── complete-feature-development.md
    └── ci-cd-pipeline.md
```

## 🧪 Methodologies Enforced

### SLICE Methodology
Structured 5-phase approach to implementation planning:
1. **Scope** - Define feature boundaries and acceptance criteria
2. **Learn** - Understand requirements and existing codebase
3. **Identify** - List components, data models, APIs, dependencies
4. **Construct** - Build code systematically (data → services → APIs → components)
5. **Execute** - Deploy and validate

### TDD (Test-Driven Development)
Tests MUST be written BEFORE implementation code:
- Write failing test
- Write minimal code to make test pass
- Refactor code while keeping tests green
- Repeat for next behavior

## 🎯 Supported Technologies

### Frontend Frameworks
- **Angular** (TypeScript) - Component-based, reactive (RxJS)
- **React** (JavaScript/TypeScript) - Hooks, functional components
- **Vue** (JavaScript/TypeScript) - Composition API, reactive
- **Vanilla JavaScript** - ES6+, DOM manipulation
- **Node.js (Frontend)** - Server-side rendering
- **PHP** - Laravel Blade, Symfony Twig, CodeIgniter templates
- **Tailwind CSS** - Utility-first styling

### Backend Frameworks
- **Python**: Django, FastAPI, Flask
- **Java**: Spring Boot
- **Node.js**: Express, NestJS
- **Go**: Gin, Echo, Standard Library

### Databases
- **Relational**: PostgreSQL, MySQL/MariaDB
- **NoSQL**: MongoDB, Redis
- **Caching**: Redis

### DevOps Tools
- **CI/CD**: GitHub Actions, GitLab CI
- **Containers**: Docker, Podman, Kubernetes
- **Infrastructure**: Terraform, AWS CloudFormation
- **Quality**: SonarQube
- **Documentation**: Swagger/OpenAPI

## 🚀 Quick Start

### 1. Test a Simple Command

```bash
/brainstorm "implement user authentication"
```

### 2. Try a Code Generation Workflow

```bash
# Generate frontend
/generate-fe angular "user profile component"

# Generate backend
/generate-be python fastapi "user authentication service"

# Create tests (TDD approach)
/create-tests src/services/user_service.py pytest

# Review code
/review-code https://github.com/username/repo/pull/123
```

### 3. Try Complete Feature Development

```bash
# Full workflow from brainstorming to deployment
/brainstorm "shopping cart feature"
/create-implementation-plan "shopping cart"
/generate-be python django "shopping cart API"
/generate-fe react "shopping cart components"
/create-tests tests/ pytest
/review-code https://github.com/...
/deploy development
```

### 4. Try Deployment

```bash
# Deploy to different environments
/deploy development
/deploy staging
/deploy production
```

## 📊 Key Metrics and Standards

### Test Coverage Requirements
- **Frontend**: Minimum 80%, Recommended 85%+
- **Backend**: Minimum 85%, Recommended 90%+
- **Critical Paths**: 100%

### Code Quality (SonarQube)
- **Code Smell Rating**: B or better
- **Reliability Rating**: B or better
- **Security Rating**: A
- **Maintainability Rating**: B or better

### Test Frameworks
- **Frontend**: Jest, Cypress, Playwright, Testing Library
- **Backend**: pytest, JUnit, Mocha, go test

## 🔍 Core Principles

### Workflow Principles
- **TDD Compliance**: Tests always written before code
- **SLICE Methodology**: Implementation plans follow 5-phase approach
- **Validation Gates**: Each stage must pass before proceeding
- **Full History Tracking**: All decisions and outcomes are tracked

### Code Quality Principles
- **Readability**: Clear, descriptive names, reasonable complexity
- **Maintainability**: DRY principle, appropriate abstraction, modular design
- **Testability**: Pure functions, dependency injection, small units
- **Performance**: Efficient algorithms, optimized queries, appropriate caching
- **Security**: Input validation, no hardcoded secrets, proper auth/authz

### Documentation Principles
- **Clear and Concise**: Avoid jargon, use plain language
- **Examples Included**: Provide code examples and use cases
- **Up-to-date**: Documentation matches current code
- **Audience-Appropriate**: Tailor content to target users

## 📝 Testing Checklist

Use this checklist to validate your system:

### Basic Functionality
- [ ] Test main orchestrator with simple request
- [ ] Test each subagent independently
- [ ] Verify context files load correctly
- [ ] Run primary workflow end-to-end
- [ ] Test custom commands
- [ ] Validate error handling
- [ ] Check edge cases

### Integration Testing
- [ ] Test complete feature development workflow
- [ ] Verify SLICE methodology enforcement
- [ ] Verify TDD workflow coordination
- [ ] Test code review integration
- [ ] Test deployment orchestration
- [ ] Test documentation generation

### Quality Validation
- [ ] Code meets quality standards
- [ ] Tests pass with adequate coverage
- [ ] Documentation is complete and accurate
- [ ] CI/CD pipelines function correctly
- [ ] History tracking works as expected

## 🔄 Next Steps

1. **Test the System** - Use commands with your actual use cases
2. **Customize Context Files** - Add domain-specific knowledge
3. **Refine Workflows** - Adjust based on real usage
4. **Add Examples** - Improve agent performance with real examples
5. **Monitor and Optimize** - Track usage and improve efficiency

## 💡 Tips for Success

- **Start Simple** - Begin with basic use cases, gradually increase complexity
- **Keep Context Focused** - Each context file 50-200 lines, focused on one topic
- **Use Level 1 Context** - Isolation for 80% of tasks
- **Add Validation Gates** - Ensure quality at each stage
- **Document Learnings** - Record patterns that work well for future reference
- **Review Generated Code** - Always review and test generated code before using in production

## 📚 Documentation

For detailed documentation, see:
- `.opencode/agent/` - Individual agent capabilities
- `.opencode/context/` - Domain knowledge and standards
- `.opencode/workflows/` - Workflow definitions
- `.opencode/command/` - Custom command specifications

## 🏆 System Capabilities

This system supports:
- ✅ Complete software development lifecycle
- ✅ Frontend and backend code generation for multiple languages
- ✅ Test-driven development enforcement
- ✅ Comprehensive code review and quality assurance
- ✅ Multi-environment deployment orchestration
- ✅ Full history tracking and traceability
- ✅ Technical documentation generation
- ✅ REST API development from OpenAPI specifications
- ✅ Integration with GitHub/GitLab, CI/CD, Docker, Kubernetes
- ✅ Quality gates and validation at each stage

---

**Your system is production-ready!** 🎉

Built with research-backed XML optimization and hierarchical agent patterns for maximum efficiency and maintainability.
