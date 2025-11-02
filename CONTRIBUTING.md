# Contributing to Textile Showcase

Thank you for your interest in contributing to this contemporary textile design portfolio project! This document outlines the development workflow and standards.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/maxrantil/textile-showcase.git
   cd textile-showcase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Sanity CMS credentials
   ```

4. **Install pre-commit hooks**
   ```bash
   pre-commit install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Strategy

- **Never commit directly to `master`**
- Create descriptive feature branches: `feat/gallery-optimization`, `fix/mobile-nav`
- Reference issues when applicable: `feat/issue-123-description`

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Follow Test-Driven Development (TDD)**
   - Write failing test first (RED)
   - Write minimal code to pass (GREEN)
   - Refactor while keeping tests green (REFACTOR)
   - **All new features require tests** (unit, integration, E2E)

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add gallery keyboard navigation"
   ```
   - Use conventional commit format: `feat:`, `fix:`, `chore:`, `docs:`
   - Write clear, concise commit messages
   - **Pre-commit hooks will run automatically** (never bypass with `--no-verify`)

4. **Push and create a Pull Request**
   ```bash
   git push origin feat/your-feature-name
   ```

## 🧪 Testing Requirements

### Test Types (All Required)

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# E2E with visible browser (debugging)
npm run test:e2e:headed

# Type checking
npm run type-check

# Linting
npm run lint
```

### Coverage Requirements

- Maintain existing test coverage (currently 93.68% line coverage)
- All new features must include comprehensive tests
- Bug fixes must include regression tests

## 💻 Code Standards

### TypeScript

- Type hints required for all code
- Strict mode enforced
- Use explicit types, avoid `any`

### Code Style

- **Formatting**: Prettier (runs automatically via pre-commit)
- **Linting**: ESLint (runs automatically via pre-commit)
- **Naming Conventions**:
  - Functions/variables: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### File Requirements

- All code files start with: `// ABOUTME: [brief description]`
- Keep functions focused and small
- Use descriptive variable names
- Comment complex logic

### Best Practices

- **Simple over clever**: Prioritize readability
- **DRY principle**: Don't repeat yourself
- **Early returns**: Avoid deep nesting
- **Minimal changes**: Only modify what's necessary for the task
- **Match existing patterns**: Follow the codebase style

## 🔧 Pre-commit Hooks

Pre-commit hooks run automatically before each commit:

- **Prettier**: Auto-format code
- **ESLint**: Check code quality
- **TypeScript**: Verify types
- **Test**: Run affected tests
- **Security**: Scan for credentials and secrets

**Never bypass hooks with `--no-verify`** unless you have a critical reason.

## 📦 Pull Request Process

1. **Ensure all tests pass**
   ```bash
   npm test && npm run test:e2e
   npm run type-check
   npm run lint
   ```

2. **Update documentation**
   - Update README.md if adding features
   - Add JSDoc comments for new functions
   - Update relevant guides in `/docs`

3. **Create a descriptive PR**
   - Clear title explaining the change
   - Description with context and rationale
   - Reference related issues: `Fixes #123`
   - Include screenshots for UI changes

4. **Pass CI/CD checks**
   - All tests must pass
   - Type checking must pass
   - Linting must be clean
   - Security scan must be clean

5. **Code review**
   - Address review feedback
   - Keep discussions focused and professional

## 🏗️ Architecture Guidelines

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **CMS**: Sanity
- **Testing**: Jest, React Testing Library, Playwright
- **Type Safety**: TypeScript

### Key Principles

- **Performance**: Optimize images, lazy load components, minimize bundle size
- **Accessibility**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first design
- **SEO**: Structured data, meta tags, sitemaps
- **Security**: Input validation, XSS prevention, rate limiting

### Component Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── desktop/      # Desktop-specific
│   ├── mobile/       # Mobile-specific
│   └── ui/           # Shared UI components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── sanity/           # CMS integration
```

## 🐛 Reporting Issues

When reporting bugs:

1. Check existing issues first
2. Provide clear reproduction steps
3. Include environment details (browser, OS)
4. Add screenshots if applicable
5. Describe expected vs actual behavior

## ✨ Feature Requests

When requesting features:

1. Explain the problem you're solving
2. Describe your proposed solution
3. Consider alternative approaches
4. Discuss impact on existing features

## 📞 Getting Help

- Review existing documentation in `/docs`
- Check component tests for usage examples
- Open a GitHub issue for questions

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as this project.

---

**Thank you for contributing to this project!** Every improvement, no matter how small, is appreciated.
