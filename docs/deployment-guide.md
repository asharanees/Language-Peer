# LanguagePeer Deployment Guide

## Quick Start - Automated Setup & Deployment (Recommended)

For fully automated setup and deployment with minimal user interaction:

### Step 1: Configuration Setup
```bash
# Interactive configuration (first time only)
./scripts/setup-config.sh
```

This will guide you through:
- GitHub repository configuration
- AWS credentials and region setup
- Domain names (optional)
- Environment selection

### Step 2: Automated Deployment
```bash
# Deploy to development (default)
./scripts/auto-deploy.sh

# Deploy to specific environment
./scripts/auto-deploy.sh staging

# Force deployment (skip verification checks)
./scripts/auto-deploy.sh production true
```

### What the Scripts Handle

**Configuration Script (`setup-config.sh`):**
- ✅ Interactive prompts for all required settings
- ✅ GitHub repository validation
- ✅ AWS credentials verification
- ✅ File updates with your actual values
- ✅ Environment file generation
- ✅ Configuration summary creation

**Deployment Script (`auto-deploy.sh`):**
- ✅ Automatic prerequisite installation (Node.js, AWS CLI, CDK)
- ✅ AWS service access verification
- ✅ Dependency installation with retry logic
- ✅ Comprehensive test suite execution
- ✅ CDK bootstrapping with error handling
- ✅ Progress tracking during deployment
- ✅ Post-deployment verification
- ✅ Detailed deployment report generation

## Prerequisites

### 1. AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI installed and configured (auto-installed by script if missing)
- AWS CDK v2 installed globally (auto-installed by script if missing)

### 2. Required AWS Services Access
Ensure your AWS account has access to:
- AWS Bedrock (with Claude 3.5 Sonnet model access)
- Amazon Transcribe
- Amazon Polly
- Amazon Comprehend
- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- Amazon API Gateway
- Amazon CloudWatch
- Amazon Kinesis
- AWS CodePipeline (for staging/production)

### 3. Local Development Environment
- Node.js 18+ and npm (auto-installed by script if missing)
- Git
- Docker (optional, for local testing)

## Automated Deployment Options

### Basic Usage
```bash
./scripts/auto-deploy.sh [environment] [force_deploy]
```

### Examples
```bash
# Deploy to development with automatic checks
./scripts/auto-deploy.sh

# Deploy to development, forcing through any issues
./scripts/auto-deploy.sh development true

# Deploy to staging with verification
./scripts/auto-deploy.sh staging false

# Deploy to production (requires confirmation unless forced)
./scripts/auto-deploy.sh production true
```

### Environment Variables
- `AWS_DEFAULT_REGION` - AWS region (default: us-east-1)
- `AWS_PROFILE` - AWS profile to use

### Auto-Deploy Features

The script provides comprehensive automation:

1. **Prerequisite Management**
   - Detects and installs Node.js via package managers (winget, chocolatey)
   - Installs AWS CLI automatically
   - Installs AWS CDK globally
   - Verifies AWS credentials and permissions

2. **Service Verification**
   - Tests access to all required AWS services
   - Validates Bedrock model availability
   - Checks regional service availability

3. **Dependency Management**
   - Installs root and frontend dependencies with retry logic
   - Handles npm cache issues automatically
   - Provides detailed progress feedback

4. **Testing Integration**
   - Runs linting checks
   - Executes unit test suite
   - Validates infrastructure tests
   - Continues deployment even with test warnings

5. **Deployment Process**
   - CDK synthesis validation
   - Frontend build process
   - Environment-specific deployment
   - Production deployment confirmation

6. **Verification & Reporting**
   - CloudFormation stack status checks
   - API endpoint health testing
   - Demo environment validation
   - Comprehensive deployment report generation

## Manual Deployment (Advanced Users)

### Step-by-Step Deployment

### Step 1: Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-github-username/language-peer.git
cd language-peer

# Run configuration setup (recommended)
./scripts/setup-config.sh

# OR configure manually:
# Install dependencies
npm install
cd src/frontend && npm install && cd ../..

# Configure AWS credentials
aws configure
# OR use AWS profiles
export AWS_PROFILE=your-profile-name

# Set environment variables (if not using setup script)
export AWS_DEFAULT_REGION=us-east-1
export GITHUB_OWNER=your-github-username
export GITHUB_REPO=language-peer
```

### Step 2: Pre-deployment Validation

```bash
# Run tests to ensure everything is working
npm run test:unit
npm run test:infrastructure

# Validate CDK synthesis
npm run cdk:synth

# Check for any linting issues
npm run lint
```

### Step 3: Development Environment Deployment

```bash
# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy development environment
npm run deploy:dev

# Or deploy individual stacks
npm run deploy:core
npm run deploy:voice
npm run deploy:agents
npm run deploy:monitoring
```

### Step 4: Verify Development Deployment

```bash
# Check stack outputs
aws cloudformation describe-stacks --stack-name LanguagePeer-Core-development --query 'Stacks[0].Outputs'

# Test API endpoints
curl -X GET "$(aws cloudformation describe-stacks --stack-name LanguagePeer-Core-development --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)health"

# Check demo environment
curl -X GET "$(aws cloudformation describe-stacks --stack-name LanguagePeer-Demo-development --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text)demo/health"
```

### Step 5: Staging Environment Deployment

```bash
# Deploy staging environment (includes pipeline)
npm run deploy:staging

# Monitor deployment in AWS Console
# CodePipeline: https://console.aws.amazon.com/codesuite/codepipeline/
```

### Step 6: Production Environment Deployment

```bash
# Deploy production environment
npm run deploy:prod

# Verify production deployment
npm run test:integration -- --env=production
```

## Environment-Specific Configurations

### Development
- Minimal resources for cost optimization
- Debug logging enabled
- No email alerts
- Short log retention (7 days)

### Staging
- Production-like configuration
- Enhanced monitoring
- Email alerts enabled
- Medium log retention (30 days)

### Production
- Full security and reliability features
- Comprehensive monitoring
- All alerts enabled
- Long log retention (90 days)

## Post-Deployment Verification

### 1. Infrastructure Health Check
```bash
# Check all stacks are deployed successfully
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Verify DynamoDB tables
aws dynamodb list-tables

# Check S3 buckets
aws s3 ls

# Verify Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `LanguagePeer`)].FunctionName'
```

### 2. API Testing

#### Interactive CloudFront Test Tool
Use the provided HTML test tool for easy interactive testing:

```bash
# Open the test tool in your browser
open test-cloudfront.html
```

**Features:**
- Interactive button to test POST requests to the conversation endpoint
- Real-time display of API responses and errors
- Pre-configured test payload with sample conversation data
- Direct testing through the CloudFront CDN distribution

#### Command Line Testing
```bash
# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name LanguagePeer-Core-development --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)

# Test health endpoint
curl -X GET "${API_ENDPOINT}health"

# Test conversation endpoint via CloudFront (if deployed)
curl -X POST https://dohpefdcwoh2h.cloudfront.net/development/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello test", "agentPersonality": "friendly-tutor", "userId": "test-user"}'

# Test CORS
curl -X OPTIONS "${API_ENDPOINT}health" -H "Origin: http://localhost:3000"
```

### 3. Demo Environment Testing
```bash
# Get demo URLs
DEMO_WEBSITE=$(aws cloudformation describe-stacks --stack-name LanguagePeer-Demo-development --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text)
DEMO_API=$(aws cloudformation describe-stacks --stack-name LanguagePeer-Demo-development --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text)

# Test demo website
curl -I "$DEMO_WEBSITE"

# Test demo API
curl -X GET "${DEMO_API}demo/health"
curl -X GET "${DEMO_API}demo/users"
curl -X GET "${DEMO_API}demo/sessions"
```

### 4. Monitoring Verification
```bash
# Check CloudWatch dashboards
aws cloudwatch list-dashboards

# Verify SNS topics
aws sns list-topics

# Check log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/languagepeer"
```

### 5. Frontend Asset Verification
```bash
# Test frontend deployment
curl -I "https://your-cloudfront-url.cloudfront.net/"

# Verify manifest.json
curl -I "https://your-cloudfront-url.cloudfront.net/manifest.json"

# Check font loading (should be fast with preconnect)
curl -I "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
```

**Note**: LanguagePeer uses a minimal asset approach without favicon or icon files. This simplifies deployment and reduces load times. See [Frontend Assets Guide](frontend-assets.md) for details.

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
# Set environment for integration tests
export TEST_ENVIRONMENT=development
export AWS_REGION=us-east-1

npm run test:integration
```

### End-to-End Tests
```bash
# Install Playwright
npx playwright install

# Set demo URLs
export DEMO_BASE_URL="https://your-cloudfront-url.cloudfront.net"
export DEMO_API_URL="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"

# Run E2E tests
npm run test:e2e
```

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Issues
```bash
# Re-bootstrap with specific region
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

#### 2. Permission Errors
```bash
# Check IAM permissions
aws sts get-caller-identity
aws iam get-user
```

#### 3. Bedrock Access Issues
```bash
# Check Bedrock model access
aws bedrock list-foundation-models --region us-east-1
```

#### 4. Stack Deployment Failures
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name STACK-NAME

# View detailed error logs
aws logs filter-log-events --log-group-name /aws/cloudformation/STACK-NAME
```

### Rollback Procedures

#### Development Environment
```bash
npm run rollback
```

#### Staging/Production Environment
```bash
npm run rollback:staging
npm run rollback:prod
```

#### Manual Rollback
```bash
# List stack versions
aws cloudformation list-change-sets --stack-name STACK-NAME

# Rollback to previous version
aws cloudformation cancel-update-stack --stack-name STACK-NAME
```

## Monitoring and Maintenance

### CloudWatch Dashboards
- Access: https://console.aws.amazon.com/cloudwatch/
- Dashboard: LanguagePeer-{environment}

### Key Metrics to Monitor
- API Gateway request count and latency
- Lambda function duration and errors
- DynamoDB read/write capacity and throttling
- S3 request metrics
- Custom application metrics (conversation success rate, voice processing latency)

### Alerts and Notifications
- SNS topic: LanguagePeer-Alerts-{environment}
- Email notifications for production issues
- Automated responses for critical alerts

### Log Analysis
- CloudWatch Logs Insights queries available
- Structured logging with JSON format
- Performance and error tracking

## Security Considerations

### Data Protection
- All data encrypted at rest and in transit
- DynamoDB encryption enabled
- S3 bucket encryption enabled

### Access Control
- IAM roles with least privilege principle
- API Gateway throttling configured
- WAF protection for production

### Compliance
- CloudTrail logging enabled
- GuardDuty monitoring (staging/production)
- Regular security assessments

## Cost Optimization

### Development Environment
- Pay-per-request DynamoDB billing
- Minimal Kinesis shards
- Short log retention periods

### Production Environment
- Reserved capacity where appropriate
- Lifecycle policies for S3 storage
- Automated scaling based on demand

## Support and Documentation

- **Architecture Diagrams**: [docs/architecture-diagram.md](architecture-diagram.md)
- **API Documentation**: Available at demo API endpoints
- **Troubleshooting**: Check CloudWatch logs and metrics
- **Support**: Create GitHub issues for problems

---

**Next Steps**: After successful deployment, proceed with the testing guide to validate all functionality.