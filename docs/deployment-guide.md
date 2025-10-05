# Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm installed
- AWS CDK v2 installed globally (`npm install -g aws-cdk`)
- Docker installed (for Lambda function builds)

## Required AWS Permissions

Your AWS user/role needs the following permissions:
- Bedrock model access (Claude, Llama, Nova)
- Lambda function creation and execution
- DynamoDB table creation and management
- S3 bucket creation and object management
- Transcribe and Polly service access
- Comprehend service access
- Kinesis stream creation and management
- CloudWatch logs and metrics
- API Gateway creation and management

## Step-by-Step Deployment

### 1. Clone and Setup

```bash
git clone https://github.com/username/language-peer.git
cd language-peer
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your AWS configuration
AWS_REGION=us-east-1
AWS_PROFILE=your-profile
BEDROCK_MODELS=claude-3-5-sonnet,llama-3-1,nova-pro
```

### 3. Bootstrap CDK (First Time Only)

```bash
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### 4. Deploy Infrastructure

```bash
# Deploy all stacks
npm run deploy

# Or deploy specific stacks
npx cdk deploy LanguagePeerInfraStack
npx cdk deploy LanguagePeerApiStack
npx cdk deploy LanguagePeerFrontendStack
```

### 5. Verify Deployment

```bash
# Check stack status
npx cdk list

# Test API endpoints
curl https://your-api-gateway-url/health

# Check Bedrock model access
aws bedrock list-foundation-models --region us-east-1
```

## Test Credentials

For hackathon judges and demo purposes:

- **Demo URL**: https://language-peer.demo.aws
- **Test User**: demo@languagepeer.com
- **Password**: DemoUser2025!

## Monitoring and Logs

- **CloudWatch Dashboard**: Available in AWS Console
- **API Logs**: CloudWatch Logs group `/aws/lambda/language-peer-api`
- **Frontend Logs**: CloudWatch Logs group `/aws/amplify/language-peer-frontend`

## Troubleshooting

### Common Issues

1. **Bedrock Access Denied**: Ensure your region supports the required models
2. **Lambda Timeout**: Increase timeout in CDK configuration
3. **CORS Issues**: Check API Gateway CORS configuration
4. **Voice Processing Errors**: Verify Transcribe/Polly permissions

### Support

For deployment issues, check:
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Bedrock User Guide](https://docs.aws.amazon.com/bedrock/)
- [Project Issues](https://github.com/username/language-peer/issues)