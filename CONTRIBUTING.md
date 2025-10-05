# Contributing to LanguagePeer

Thank you for your interest in contributing to LanguagePeer! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and inclusive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/language-peer.git
   cd language-peer
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment** following the [deployment guide](docs/deployment-guide.md)

## Development Process

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(agents): add pronunciation coach personality`
- `fix(voice): resolve Transcribe streaming timeout`
- `docs(api): update authentication examples`

### Pull Request Process

1. **Create a feature branch** from `develop`
2. **Make your changes** with appropriate tests
3. **Run the test suite**:
   ```bash
   npm test
   npm run lint
   ```
4. **Update documentation** if needed
5. **Submit a pull request** to `develop` branch

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Development Guidelines

### Code Style

- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured rules
- **Prettier**: Auto-format code
- **Comments**: Document complex logic and public APIs

### Testing

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test AWS service integrations
- **E2E Tests**: Test complete user workflows
- **Coverage**: Aim for >80% code coverage

### AWS Services

- **Bedrock**: Use appropriate models for different agent personalities
- **Lambda**: Keep functions small and focused
- **DynamoDB**: Design efficient query patterns
- **S3**: Implement proper lifecycle policies

### Voice Processing

- **Transcribe**: Handle confidence scores and alternatives
- **Polly**: Use SSML for pronunciation guidance
- **Audio Quality**: Implement quality assessment and feedback

## Project Structure

```
language-peer/
├── src/
│   ├── agents/           # AI agent implementations
│   ├── backend/          # Lambda functions
│   ├── frontend/         # React application
│   ├── infrastructure/   # CDK deployment
│   └── shared/          # Common utilities
├── docs/                # Documentation
├── tests/               # Test files
└── .github/            # GitHub workflows
```

## Issue Guidelines

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation approach
- Potential breaking changes

### Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - High priority items

## AWS GenAI Hackathon Specific

### Requirements Compliance

Ensure contributions maintain:
- ✅ **LLM Integration**: AWS Bedrock foundation models
- ✅ **Required Services**: Bedrock Agents, Transcribe, Polly, etc.
- ✅ **Autonomous Agents**: Independent reasoning and decision-making

### Demo Considerations

- Keep demo scenarios working
- Test with provided demo credentials
- Ensure 3-minute demo video remains accurate

## Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Strands Agents Framework](https://github.com/strands-ai/strands)
- [React Documentation](https://reactjs.org/docs/)
- [AWS CDK Guide](https://docs.aws.amazon.com/cdk/)

## Questions?

- Open an issue for technical questions
- Check existing issues and discussions
- Review documentation in the `docs/` folder

Thank you for contributing to LanguagePeer! 🚀