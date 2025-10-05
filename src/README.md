# Source Code Structure

## Directory Organization

```
src/
├── agents/                 # Strands AI agent implementations
│   ├── personalities/      # Agent personality configurations
│   ├── base/              # Base agent classes and interfaces
│   └── coordination/      # Multi-agent coordination logic
├── backend/               # AWS Lambda functions and services
│   ├── api/              # API Gateway handlers
│   ├── voice/            # Transcribe/Polly integration
│   ├── analysis/         # Comprehend language analysis
│   └── data/             # DynamoDB operations
├── frontend/             # React web application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Application pages
│   ├── hooks/           # Custom React hooks
│   └── services/        # API client services
├── infrastructure/       # AWS CDK deployment code
│   ├── stacks/          # CDK stack definitions
│   ├── constructs/      # Reusable CDK constructs
│   └── config/          # Environment configurations
└── shared/              # Shared types and utilities
    ├── types/           # TypeScript type definitions
    ├── utils/           # Common utility functions
    └── constants/       # Application constants
```

## Getting Started

Each directory contains its own README with specific setup instructions:

- [Agents](agents/README.md) - AI agent development
- [Backend](backend/README.md) - Serverless API development
- [Frontend](frontend/README.md) - React application development
- [Infrastructure](infrastructure/README.md) - AWS CDK deployment

## Development Workflow

1. **Setup**: Follow the main README for initial setup
2. **Development**: Work in specific directories based on your focus area
3. **Testing**: Run tests from the root directory or specific subdirectories
4. **Deployment**: Use CDK commands from the infrastructure directory