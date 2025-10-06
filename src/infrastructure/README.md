# Infrastructure as Code

This module contains AWS CDK infrastructure definitions for LanguagePeer.

## Structure

- `stacks/` - CDK stack definitions for different service layers
- `constructs/` - Reusable CDK constructs
- `config/` - Environment-specific configurations

## Stacks

### LanguagePeerStack (Core)
- DynamoDB tables for users and sessions
- API Gateway with CORS configuration
- IAM roles and policies
- CloudWatch logging

### VoiceProcessingStack
- S3 bucket for audio storage
- IAM roles for Transcribe and Polly access
- Lambda functions for voice processing
- Audio quality analysis pipeline

### AgentStack
- Bedrock model access and permissions
- Kinesis stream for real-time analytics
- CloudWatch log groups for agent activities
- Multi-agent coordination infrastructure

## Deployment

### Prerequisites
```bash
npm install -g aws-cdk
aws configure
```

### Bootstrap CDK (first time only)
```bash
npm run cdk:bootstrap
```

### Deploy to Development
```bash
npm run deploy:dev
```

### Deploy to Production
```bash
npm run deploy:prod
```

## Environment Configuration

Each environment (dev/staging/prod) has its own:
- Stack naming conventions
- Resource sizing and limits
- Security policies and access controls
- Monitoring and alerting configurations

## Monitoring

All stacks include:
- CloudWatch metrics and alarms
- X-Ray tracing for performance monitoring
- Cost allocation tags for billing
- Security compliance scanning