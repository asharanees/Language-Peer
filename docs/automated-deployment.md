# Automated Deployment Guide

This guide covers the comprehensive automated deployment system for LanguagePeer, designed to provide a fully automated, zero-configuration deployment experience.

## 🚀 Quick Start - Fully Automated Setup & Deployment

The **new and improved** automated setup and deployment system handles everything for you:

```bash
# Clone the repository
git clone https://github.com/your-github-username/language-peer.git
cd language-peer

# Step 1: Interactive configuration setup (first time only)
./scripts/setup-config.sh

# Step 2: Fully automated deployment
./scripts/auto-deploy.sh
```

### What the Setup Script Does:
- 🔧 **Interactive Configuration**: Prompts for GitHub, AWS, and domain settings
- ✅ **Validation**: Checks repository access and AWS credentials
- 📝 **File Updates**: Replaces all placeholders with your actual values
- 🎯 **Environment Creation**: Generates `.env` file and configuration summary

### What the Deployment Script Does:
- 🔧 Install Node.js, AWS CLI, and CDK if missing
- 🔐 Verify AWS credentials and service access
- 📦 Install all dependencies with retry logic
- 🧪 Run comprehensive test suite
- 🏗️ Deploy complete infrastructure to AWS
- ✅ Verify deployment and generate detailed report
- 📊 Provide next steps and important URLs

## Deployment Options

### Basic Usage
```bash
./scripts/auto-deploy.sh [environment] [force_deploy]
```

### Examples
```bash
# Deploy to development (default)
./scripts/auto-deploy.sh

# Deploy to staging with verification
./scripts/auto-deploy.sh staging

# Deploy to production with confirmation
./scripts/auto-deploy.sh production

# Force deployment (skip verification checks)
./scripts/auto-deploy.sh production true
```

### Windows PowerShell Alternative
```powershell
# Use the PowerShell version for Windows
.\scripts\auto-deploy.ps1 -Environment development
.\scripts\auto-deploy.ps1 -Environment staging
.\scripts\auto-deploy.ps1 -Environment production -ForceDeploy $true
```

### NPM Scripts (Legacy)
```bash
# Traditional npm-based deployment
npm run deploy:dev      # Development
npm run deploy:staging  # Staging  
npm run deploy:prod     # Production
```

## 🎯 What Gets Automated

### 🔧 Prerequisites Management
- ✅ **Node.js 18+** - Auto-installed via winget/chocolatey on Windows
- ✅ **AWS CLI** - Auto-installed via winget/chocolatey on Windows  
- ✅ **AWS CDK** - Auto-installed globally via npm
- ✅ **Project Dependencies** - Root and frontend packages with retry logic
- ✅ **Version Validation** - Ensures compatible versions are installed

### 🔐 AWS Service Verification
The script comprehensively tests access to all required AWS services:
- ✅ **AWS Bedrock** - Foundation model access (Claude, Llama, Nova)
- ✅ **Amazon Transcribe** - Speech-to-text service access
- ✅ **Amazon Polly** - Text-to-speech service access
- ✅ **Amazon Comprehend** - Natural language processing access
- ✅ **DynamoDB** - NoSQL database access
- ✅ **S3** - Object storage access
- ✅ **Lambda** - Serverless compute access
- ✅ **API Gateway** - API management access
- ✅ **CloudWatch** - Monitoring and logging access
- ✅ **Kinesis** - Real-time data streaming access
- ✅ **IAM** - Identity and access management permissions
- ✅ **CloudFormation** - Infrastructure as code access

### 🏗️ Deployment Process
- ✅ **CDK Bootstrapping** - First-time CDK setup with error handling
- ✅ **Code Quality Checks** - Linting and formatting validation
- ✅ **Test Suite Execution** - Unit, integration, and infrastructure tests
- ✅ **Frontend Build** - React application compilation
- ✅ **Infrastructure Synthesis** - CDK template generation and validation
- ✅ **Progressive Stack Deployment** - Core → Voice → Agents → Monitoring → Demo
- ✅ **Real-time Progress Tracking** - Colored output with status updates
- ✅ **Post-deployment Verification** - Stack status and API health checks
- ✅ **Comprehensive Reporting** - Detailed deployment report with URLs and next steps

### 📊 Advanced Features
- ✅ **Retry Logic** - Automatic retry for transient failures
- ✅ **Error Recovery** - Intelligent error handling and suggestions
- ✅ **Force Deployment** - Override verification checks when needed
- ✅ **Environment-specific Configuration** - Dev/staging/production optimizations
- ✅ **Logging** - Complete deployment logs for troubleshooting
- ✅ **Cleanup on Failure** - Automatic resource cleanup on deployment failures

## Features

### 🔄 Retry Logic
- Automatic retry for dependency installation failures
- Network timeout handling
- Cache clearing on failures

### 📊 Progress Tracking
- Real-time deployment status
- Colored output for easy reading
- Detailed logging to file

### 🛡️ Error Handling
- Comprehensive error detection
- Graceful failure handling
- Detailed error messages with solutions

### 📋 Verification
- Stack status verification
- API endpoint health checks
- Service availability testing

### 📄 Reporting
- Detailed deployment reports
- Important URLs and endpoints
- Next steps guidance

## Prerequisites

### Required
- **AWS Account** with appropriate permissions
- **AWS CLI** configured with credentials
- **Node.js 18+** and npm

### Automatic Installation (Windows)
The scripts can automatically install missing prerequisites on Windows using:
- **winget** (Windows Package Manager)
- **chocolatey** (if winget is not available)

### Manual Installation (Linux/macOS)
If automatic installation fails, install manually:

```bash
# Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure
```

## Environment Variables

### Automated Configuration (Recommended)

Run the setup script to configure all variables interactively:

```bash
# Interactive setup - handles all configuration
./scripts/setup-config.sh
```

This creates a `.env` file with all necessary variables.

### Manual Configuration

If you prefer manual setup, set these environment variables:

```bash
# GitHub Configuration (Required for CI/CD)
export GITHUB_OWNER=your-github-username
export GITHUB_REPO=language-peer

# AWS Configuration
export AWS_DEFAULT_REGION=us-east-1
export AWS_PROFILE=your-profile-name

# Domain Configuration (Optional)
export PROD_DOMAIN=languagepeer.com
export STAGING_DOMAIN=staging.languagepeer.com

# Deployment Configuration
export DEPLOY_ENVIRONMENTS="development staging production"
```

## Deployment Environments

### Development
- **Purpose**: Local development and testing
- **Resources**: Minimal for cost optimization
- **Monitoring**: Basic logging
- **Command**: `npm run deploy:auto`

### Staging
- **Purpose**: Pre-production testing
- **Resources**: Production-like configuration
- **Monitoring**: Enhanced monitoring with alerts
- **Command**: `npm run deploy:auto:staging`

### Production
- **Purpose**: Live application
- **Resources**: Full security and reliability features
- **Monitoring**: Comprehensive monitoring and alerting
- **Command**: `npm run deploy:auto:prod`

## Troubleshooting

### Common Issues

#### 1. AWS Credentials Not Configured
```bash
# Error: AWS credentials are not configured
# Solution:
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

#### 2. Insufficient AWS Permissions
```bash
# Error: Access denied for service X
# Solution: Ensure your AWS user has permissions for:
# - CloudFormation (full access)
# - IAM (full access)
# - S3 (full access)
# - Lambda (full access)
# - DynamoDB (full access)
# - API Gateway (full access)
# - Bedrock (model access)
# - Transcribe, Polly, Comprehend (full access)
```

#### 3. Node.js Version Issues
```bash
# Error: Node.js version 18+ is required
# Solution:
# Update Node.js to version 18 or higher
# Use nvm for version management
```

#### 4. CDK Bootstrap Issues
```bash
# Error: CDK bootstrap failed
# Solution:
npx cdk bootstrap aws://YOUR-ACCOUNT-ID/YOUR-REGION
```

#### 5. Bedrock Access Issues
```bash
# Error: Bedrock access denied
# Solution:
# 1. Ensure Bedrock is available in your region
# 2. Request model access in AWS Console
# 3. Check IAM permissions for Bedrock
```

### Force Deployment

If you encounter non-critical issues but want to proceed:

```bash
# Linux/macOS
./scripts/auto-deploy.sh development true

# Windows
.\scripts\auto-deploy.ps1 -Environment development -ForceDeploy $true
```

### Logs and Debugging

All deployment activities are logged:

```bash
# Check deployment logs
ls deployment-*.log

# View recent log
tail -f deployment-$(ls deployment-*.log | tail -1)

# Check AWS CloudFormation events
aws cloudformation describe-stack-events --stack-name LanguagePeer-Core-development
```

## Post-Deployment

### Verification Steps

1. **Check Deployment Report**
   - Review the generated `deployment-report-*.md` file
   - Verify all stack statuses are `*_COMPLETE`

2. **Test API Endpoints**
   ```bash
   # Get API endpoint from CloudFormation
   API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name LanguagePeer-Core-development --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)
   
   # Test health endpoint
   curl $API_ENDPOINT/health
   ```

3. **Visit Demo Website**
   - Check the deployment report for the demo website URL
   - Test the voice interface functionality

4. **Monitor Application**
   - Access CloudWatch dashboard (URL in deployment report)
   - Check logs for any errors

### Integration Testing

Run comprehensive tests after deployment:

```bash
# Set environment
export TEST_ENVIRONMENT=development

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Cleanup

When you're done testing:

```bash
# Remove all deployed resources
npm run rollback

# Or for specific environments
npm run rollback:staging
npm run rollback:prod
```

## Advanced Configuration

### Custom Regions

Deploy to different AWS regions:

```bash
export AWS_DEFAULT_REGION=eu-west-1
./scripts/auto-deploy.sh development false
```

### CI/CD Integration

For automated deployments in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Deploy to AWS
  run: |
    export AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
    export AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
    export AWS_DEFAULT_REGION=us-east-1
    ./scripts/auto-deploy.sh staging true
```

### Custom Stack Deployment

Deploy individual stacks:

```bash
# Deploy only core infrastructure
npm run deploy:core

# Deploy only voice processing
npm run deploy:voice

# Deploy only AI agents
npm run deploy:agents
```

## Support

If you encounter issues:

1. **Check the logs** in `deployment-*.log`
2. **Review the troubleshooting section** above
3. **Check AWS CloudFormation console** for detailed error messages
4. **Create a GitHub issue** with logs and error details

## Security Considerations

- ✅ All data encrypted at rest and in transit
- ✅ IAM roles follow least privilege principle
- ✅ API Gateway throttling configured
- ✅ CloudTrail logging enabled
- ✅ GuardDuty monitoring (staging/production)

## Cost Optimization

- ✅ Development environment uses minimal resources
- ✅ Pay-per-request billing where possible
- ✅ Automatic scaling based on demand
- ✅ Short log retention for development
- ✅ Lifecycle policies for S3 storage

---

**Next Steps**: After successful deployment, check out the [Testing Guide](testing-guide.md) to validate all functionality.