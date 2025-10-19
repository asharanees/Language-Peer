# Quick Deployment Guide

## Overview

LanguagePeer uses **AWS CDK** for infrastructure deployment, not AWS Amplify. The architecture includes:

- **CloudFront** - CDN for frontend and API routing
- **S3** - Static website hosting for React frontend
- **API Gateway + Lambda** - Backend API services
- **DynamoDB** - Data storage
- **Bedrock, Transcribe, Polly** - AI services

## Quick Start

### 1. Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- AWS CDK v2 installed globally

### 2. Deploy with PowerShell (Windows)

```powershell
# Run the automated deployment script
.\scripts\auto-deploy.ps1

# Or with specific environment
.\scripts\auto-deploy.ps1 -Environment development -ForceDeploy $true
```

### 3. Deploy with Bash (Linux/Mac)

```bash
# Run the automated deployment script
./scripts/auto-deploy.sh

# Or with specific environment
./scripts/auto-deploy.sh development true
```

### 4. Manual Deployment (if scripts fail)

```bash
# Install dependencies
npm install
cd src/frontend && npm install && cd ../..

# Build frontend
cd src/frontend && npm run build && cd ../..

# Deploy infrastructure
npm run cdk:bootstrap
npm run deploy:dev
```

## Architecture

Your application is deployed as:

1. **Frontend**: React app built and uploaded to S3
2. **CloudFront**: Serves frontend from S3 and proxies API calls to API Gateway
3. **API Gateway**: Routes backend requests to Lambda functions
4. **Lambda**: Handles conversation, transcription, and TTS requests

## API Endpoint

Your frontend calls: `https://dohpefdcwoh2h.cloudfront.net/development`

This CloudFront URL:
- Serves your React app for `/` requests
- Proxies API calls to `/development/*` to your API Gateway

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**: Run `npm run cdk:bootstrap` first
2. **AWS Permissions**: Ensure your AWS credentials have CDK deployment permissions
3. **Bedrock Access**: Verify Bedrock model access in your AWS region
4. **Node Version**: Use Node.js 18+ as specified in package.json

### Getting Help

- Check CloudFormation console for stack deployment status
- Review CloudWatch logs for Lambda function errors
- Use the deployment scripts for automated troubleshooting

## Next Steps

After successful deployment:
1. Test your CloudFront URL in a browser
2. Verify API endpoints are responding
3. Test the conversation functionality
4. Monitor CloudWatch for any issues