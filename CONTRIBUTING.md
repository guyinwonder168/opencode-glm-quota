# Contributing to opencode-glm-quota

Thank you for your interest in contributing! We welcome contributions of all types, including bug fixes, new features, documentation improvements, and bug reports.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn or pnpm
- Git

### Development Setup

1. **Fork and clone the repository**

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/opencode-glm-quota.git
cd opencode-glm-quota
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm run test
```

5. **Start development mode**

```bash
# Build on file changes (if using watch mode)
npm run build
```

## Making Changes

### Branch Strategy

- `main` - Stable production code
- Feature branches - For new features (`feature/your-feature-name`)
- Bugfix branches - For bug fixes (`bugfix/your-bugfix-name`)

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(auth): add support for zhipu provider ID

Implement provider ID detection for zhipu platform to enable
CN region API access.

Closes #123
```

```
fix(api): handle missing quota limit data gracefully

Return empty array when quota limits are not available
instead of throwing error.

Fixes #456
```

### Code Style Guidelines

Follow these conventions from [AGENTS.md](AGENTS.md):

**TypeScript Configuration:**
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Always use type annotations for function returns

**Naming Conventions:**
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`

**Import Order:**
1. Core Node.js modules (`fs`, `path`, `os`, `https`)
2. Third-party imports (`@opencode-ai/plugin`)
3. Local imports
4. Type imports (use `import type` where possible)

```typescript
// ✅ Correct
import * as fs from "fs"
import * as path from "path"
import { type Plugin, tool } from "@opencode-ai/plugin"
```

**Error Handling:**
- Always wrap file operations in try-catch blocks
- Use `null` returns for optional values, not errors
- Include fallback mechanisms
- Return user-friendly error messages

**API & HTTP Requests:**
- Use native `https` module (no fetch for Node.js compatibility)
- **CRITICAL**: Do NOT use "Bearer" prefix in Authorization header
- Always validate response status code before processing
- URL-encode query parameters using `encodeURIComponent()`

### Testing Guidelines

**Test Categories:**

1. **Functional tests** - Pure functions (formatDateTime, getTimeWindow, processQuotaLimit, createProgressBar)
2. **Module tests** - With mocks (getCredentials, platform mapping, makeRequest)
3. **Integration tests** - End-to-end credential → API → output flow
4. **Error handling tests** - Network, auth, API, parse errors
5. **Security tests** - Token masking, file permission validation, error sanitization

**Testing Commands:**

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- path/to/test.test.ts

# Watch mode during development
npm run test -- --watch

# Run tests with coverage
npm run test -- --experimental-test-coverage
```

**Test Structure:**

```
tests/
├── functional/              # Pure function tests
│   ├── date-formatter.test.ts
│   └── progress-bar.test.ts
├── module/                 # Side effect tests with mocks
│   ├── credential-discovery.test.ts
│   └── platform-mapping.test.ts
├── integration/            # End-to-end pipeline tests
│   └── full-query-pipeline.test.ts
├── error-handling/        # Error handling tests
│   ├── network-errors.test.ts
│   └── auth-errors.test.ts
└── security/             # Security-focused tests
    └── token-masking.test.ts
```

**Testing Best Practices:**
- Write tests in TypeScript with `.test.ts` extension
- Use Node.js built-in test runner (`node --test`)
- Mock file system and HTTP requests in tests
- Test error paths (missing credentials, API failures, timeout, parse errors)
- **No retry logic tests** - Plugin uses fail-fast philosophy

## Documentation Guidelines

Follow these principles from [`.opencode/context/core/standards/docs.md`](.opencode/context/core/standards/docs.md):

### Golden Rule
If users ask the same question twice, document it.

### What to Document

✅ **DO Document:**
- WHY decisions were made
- Complex algorithms/logic
- Public APIs, setup, common use cases
- Non-obvious behavior
- Known limitations
- Workarounds (with explanation)

❌ **DON'T Document:**
- Obvious code (i++ doesn't need comment)
- What code does (should be self-explanatory)
- Redundant information
- Outdated/incorrect info

### Comments

**Good Comments:**
```javascript
// Calculate discount by tier (Bronze: 5%, Silver: 10%, Gold: 15%)
const discount = getDiscountByTier(customer.tier);

// HACK: API returns null instead of [], normalize it
const items = response.items || [];

// TODO: Use async/await when Node 18+ is minimum
```

**Bad Comments:**
```javascript
// Increment i
i++;

// Get user
const user = getUser();
```

### Function Documentation

Use JSDoc-style comments for exported functions:

```typescript
/**
 * Calculate total price including tax
 *
 * @param {number} price - Base price
 * @param {number} taxRate - Tax rate (0-1)
 * @returns {number} Total with tax
 *
 * @example
 * calculateTotal(100, 0.1) // 110
 */
function calculateTotal(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```

### README Structure

Follow this structure for README.md:

```markdown
# Project Name
Brief description (1-2 sentences)

## Features
- Key feature 1
- Key feature 2

## Installation
```bash
npm install package-name
```

## Quick Start
```javascript
const result = doSomething();
```

## Usage
[Detailed examples]

## API Reference
[If applicable]

## Contributing
[Link to CONTRIBUTING.md]

## License
[License type]
```

## Submitting Changes

### Pull Request Process

1. **Update documentation** - Update README, CHANGELOG.md, or inline comments
2. **Add tests** - Ensure tests pass (85% coverage threshold)
3. **Run linter** - Ensure code passes linting (`npm run lint`)
4. **Build** - Ensure project builds successfully (`npm run build`)
5. **Create PR** - Submit pull request to `main` branch

### Pull Request Template

Use the provided PR template when creating pull requests:

```
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added (if applicable)
- [ ] Documentation updated

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

### Code Review Process

- Maintainers will review your PR
- Address review comments promptly
- Keep discussion focused and constructive
- Once approved, your PR will be merged

## Reporting Bugs

Before creating bug reports, please check existing issues.

### Bug Report Template

Use the provided bug report template when filing issues:

1. **Search existing issues** - Check if your issue has already been reported
2. **Use the bug report template** - Fill in all required fields
3. **Provide minimal reproduction** - Include steps to reproduce the issue
4. **Include environment details** - Node.js version, OS, etc.
5. **Add logs/screenshots** - If applicable, include error logs or screenshots

See [`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md) for the template.

## Suggesting Enhancements

We welcome feature requests!

### Enhancement Suggestions

1. **Check existing issues** - See if your feature has already been requested
2. **Use the feature request template** - Describe the feature clearly
3. **Explain the use case** - Why would this feature be useful?
4. **Propose a solution** - How do you envision the feature working?
5. **Consider alternatives** - Are there other ways to achieve the same goal?

See [`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md) for the template.

## Getting Help

- **Issues** - Use GitHub Issues for bug reports and feature requests
- **Discussions** - Use GitHub Discussions for questions and general discussion
- **Documentation** - Check [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md) first

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to opencode-glm-quota! 🎉
