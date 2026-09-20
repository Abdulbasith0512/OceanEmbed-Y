# Contributing to OceanEmbed-X

First off, thank you for considering contributing to OceanEmbed-X! It's contributions like yours that make open-source ocean science visualization tools better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by the [OceanEmbed Code of Conduct](.github/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub Issues. Explain the problem and include information to help maintainers reproduce the issue:
* Use a clear and descriptive title.
* Describe the exact steps to reproduce the problem.
* Describe the behavior you observed after following the steps.
* Explain which behavior you expected to see instead and why.
* Provide screenshots or screen recordings if applicable.
* Specify your browser version, OS, and GPU environment.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub Issues.
* Use a clear and descriptive title.
* Provide a step-by-step description of the suggested feature or enhancement.
* Provide specific examples to demonstrate the steps.
* Explain why this enhancement would be useful to OceanEmbed users.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. Install dependencies with `npm ci`.
3. Make sure your code passes linting, type-checking, and tests:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. If you've added code that should be tested, add unit or e2e tests.
5. Ensure the test suite passes (`npm test` and `npm run test:e2e`).
6. Issue a Pull Request with a comprehensive description of changes.

## Development Workflow

- **Framework**: Next.js (App Router) & React Three Fiber (R3F)
- **Styling**: Vanilla CSS / Tailwind CSS
- **Testing**: Vitest & Playwright

Thank you for helping push ocean scientific visualization forward!
