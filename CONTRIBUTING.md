# Contributing to LanguagePeer

Thank you for your interest in contributing to LanguagePeer! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK v2 installed globally
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/language-peer.git
   cd language-peer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Configure your AWS credentials and region
   ```

5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## 🏗️ Project Structure

```
src/
├── agents/          # AI agent personalities and coordination
├── backend/         # Serverless backend services
├── frontend/        # React frontend application
├── infrastructure/  # AWS CDK infrastructure code
└── shared/          # Shared types, constants, and utilities
```

## 🧪 Testing

We maintain high test coverage across all modules:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:backend
npm run test:frontend
npm run test:infrastructure

# Run integration tests
npm run test:integration
```

## 📝 Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🔄 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards
3. Add tests for new functionality
4. Ensure all tests pass:
   ```bash
   npm test
   ```

5. Update documentation if needed
6. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: add new agent personality for business conversations"
   ```

7. Push to your fork and create a Pull Request

### PR Requirements
- [ ] All tests pass
- [ ] Code follows project style guidelines
- [ ] Documentation updated (if applicable)
- [ ] Changes are covered by tests
- [ ] PR description clearly explains the changes

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, AWS region, etc.)
- Relevant logs or error messages

## 💡 Feature Requests

For new features:
- Check existing issues to avoid duplicates
- Provide clear use case and rationale
- Consider implementation complexity
- Be open to discussion and feedback

## 🏷️ Commit Message Guidelines

We follow conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `test:` adding or updating tests
- `refactor:` code refactoring
- `chore:` maintenance tasks

## 📚 Documentation

- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update API documentation in `docs/api.md`
- Include examples for new features

## 🤝 Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## 📞 Getting Help

- Check existing [issues](https://github.com/username/language-peer/issues)
- Join our discussions
- Reach out to maintainers

Thank you for contributing to LanguagePeer! 🎉