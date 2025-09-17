# GitHub Commit Message Template

## Format

```
<type>: <description>

[optional body]

[optional footer]
```

## Examples

```
feat: add user authentication system

fix: resolve timeout issue in API calls

docs: update installation instructions

test: add unit tests for payment processing

refactor: simplify database connection logic

chore: update dependencies to latest versions

hotfix: resolve critical security vulnerability

feat: implement pagination for product catalog

Adds server-side pagination with configurable page sizes
and improved performance for large datasets.

Fixes #123
```

## Guidelines

### Commit Message Rules

- **Imperative mood**: Use "add" not "added" or "adding"
- **First line**: Keep under 50 characters
- **Issue linking**: Use "Fixes #123" or "Closes #456"
- **Atomic commits**: One logical change per commit
- **No attribution**: Never include co-author or tool mentions

### Commit Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks
- `hotfix:` Emergency fixes

### Body (Optional)

- Explain **WHY**, not WHAT
- Wrap at 72 characters
- Separate from subject with blank line

### Footer (Optional)

- Reference related issues
- Breaking changes notation
- Format: `Fixes #123`, `Closes #456`

## Usage

### Option 1: Git Template (Recommended)

```bash
git config commit.template docs/templates/github-commit-template.md
```

### Option 2: Copy Template Content

Copy the format above for manual use in commit messages.

## CLAUDE.md Compliance

This template follows all CLAUDE.md requirements:

- ✅ No co-author mentions
- ✅ No tool attribution
- ✅ Atomic commit structure
- ✅ Issue linking support
- ✅ TDD workflow compatibility
