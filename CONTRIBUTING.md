# Contributing to ESI.ts

Thank you for your interest in contributing to ESI.ts! This guide will help you get started.

## Prerequisites

- **Node.js** 20 or later
- **npm**

## Getting Started

1. Fork the repository on GitHub: https://github.com/lgriffin/ESI.ts
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/ESI.ts.git
   cd ESI.ts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run the test suite to verify everything works:
   ```bash
   npm test
   ```

## Development Workflow

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature master
   ```
2. Make your changes.
3. Run the full validation suite before submitting:
   ```bash
   npm run validate
   ```
4. Commit your changes and push to your fork.
5. Open a pull request against `master`.

## Code Style

ESLint and Prettier are enforced automatically via pre-commit hooks (Husky + lint-staged). You do not need to run formatting manually -- the hooks will handle it when you commit.

If you want to check lint status manually:

```bash
npm run lint
```

## Testing

- **TDD tests** live in `tests/tdd/` and mirror the source structure.
- **BDD scenarios** live in `tests/bdd-scenarios/`.
- Run all tests:
  ```bash
  npm test
  ```
- Run tests with coverage report:
  ```bash
  npm run coverage
  ```

All pull requests must include tests for new or changed functionality. Coverage thresholds are enforced in CI.

## Pull Requests

- Target the `master` branch.
- Include tests that cover your changes.
- Ensure CI passes (build, lint, tests, coverage).
- Update `CHANGELOG.md` if your change is user-facing (new features, bug fixes, breaking changes).
- Keep pull requests focused -- one logical change per PR.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` -- a new feature
- `fix:` -- a bug fix
- `chore:` -- maintenance tasks (dependencies, CI, tooling)
- `docs:` -- documentation changes
- `test:` -- adding or updating tests
- `refactor:` -- code restructuring without behavior changes

Examples:

```
feat: add support for corporation wallet endpoint
fix: handle rate limit response from ESI
test: add coverage for alliance contacts client
```

## Reporting Bugs

Please use [GitHub Issues](https://github.com/lgriffin/ESI.ts/issues) to report bugs. Include:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0-or-later license.
