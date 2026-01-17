## Description

Brief description of changes made in this pull request.

**Example:**
- Add support for zhipu provider ID to enable CN platform
- Fix quota limit parsing when usageDetails is missing
- Update documentation with new authentication flow

## Type of Change

Mark one or more options that apply:

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update (changes only to documentation)
- [ ] Performance improvement (code changes that improve performance)
- [ ] Code refactoring (code changes that neither fixes bug nor adds feature)

## Related Issues

Fixes #<issue_number>
Closes #<issue_number>
Related to #<issue_number>

## Motivation and Context

Why is this change required? What problem does it solve?

**Example:**
Users reported that they couldn't use the plugin with Zhipu platform credentials. This change adds provider ID detection for zhipu platform and maps it to the correct API endpoints.

If this PR fixes a bug, link to the issue with `Fixes #<issue_number>`.

## Changes Made

Detailed list of changes:

- [ ] Added feature X
- [ ] Fixed bug Y
- [ ] Updated documentation for Z
- [ ] Added/updated tests for ...

**Files Changed:**
- `src/index.ts` - Added platform detection logic
- `README.md` - Updated authentication section
- `tests/platform-mapping.test.ts` - Added tests for new feature

## Testing

### Test Strategy

Describe how you tested this change:

- [ ] Added new unit tests
- [ ] Added new integration tests
- [ ] Updated existing tests
- [ ] Manually tested with real API

### Test Results

- [ ] All tests pass locally: `npm run test`
- [ ] Test coverage meets 85% threshold
- [ ] No new lint warnings: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Manual Testing

Describe manual testing performed:

**Example:**
1. Ran `/glm_quota` with zai-coding-plan provider ID
2. Ran `/glm_quota` with zhipu provider ID
3. Verified output is correct for both platforms
4. Tested error handling with invalid credentials

## Screenshots (if applicable)

Add screenshots to help explain your changes:

**Before:**
[Screenshot or console output before changes]

**After:**
[Screenshot or console output after changes]

## Checklist

Put an `x` in the boxes that apply. You can also fill these out after creating the PR. If you're unsure about any of these, don't hesitate to ask!

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation (README.md, AGENTS.md, etc.)
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules

## Breaking Changes

If this PR introduces breaking changes, please describe them here:

**Example:**
- Removed support for environment variables as primary auth method (now fallback only)
- Changed output format from JSON to ASCII tables

**Migration Guide:**
If breaking changes, provide migration instructions:

**Example:**
Users who were using environment variables for authentication should switch to OpenCode's `/connect` command:

```bash
# Old way (no longer supported as primary method)
export ZAI_API_KEY="your-key"

# New way
opencode auth login  # Run in OpenCode TUI
# Select: Z.AI Coding Plan
```

## Additional Context

Add any other context about the PR here.

**Notes for Reviewers:**
- This change aligns with PRD section 2.2 (Platform Detection)
- API endpoints verified from official zai-coding-plugins source
- Test coverage increased from 82% to 87%

**References:**
- Related issue: #123
- PRD section: 2.2 - Platform Detection
- API docs: https://docs.z.ai/devpack/overview

---

**Reviewers:**
- @reviewer1
- @reviewer2
