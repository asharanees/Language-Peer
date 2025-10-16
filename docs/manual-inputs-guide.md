# Manual Inputs Required for LanguagePeer Deployment

This guide covers all the manual inputs you need to configure before deploying LanguagePeer.

## 🚀 Quick Setup (Recommended)

Run the automated configuration script to set up all required inputs interactively:

**Linux/macOS:**
```bash
./scripts/setup-config.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\setup-config.ps1
```

**Or using npm:**
```bash
npm run setup
```

### What the Setup Script Does

The automated setup script will:
- ✅ **Collect Configuration**: Interactively prompt for GitHub, AWS, and domain settings
- ✅ **Validate Inputs**: Check GitHub repository accessibility and AWS credentials
- ✅ **Update Files**: Replace all placeholders with your actual values
- ✅ **Create Environment**: Generate `.env` file with your configuration
- ✅ **Generate Summary**: Create `deployment-config.md` with all settings
- ✅ **Provide Next Steps**: Clear instructions for deployment

### Interactive Configuration Process

The script will guide you through:

1. **GitHub Configuration**
   - GitHub username/organization
   - Repository name (defaults to `language-peer`)
   - Repository validation and accessibility check

2. **AWS Configuration**
   - AWS region selection (defaults to `us-east-1`)
   - AWS credentials validation
   - Service availability verification

3. **Domain Configuration** (Optional)
   - Production domain (e.g., `languagepeer.com`)
   - Staging domain (e.g., `staging.languagepeer.com`)

4. **Environment Selection**
   - Choose which environments to deploy (dev, staging, production)
   - Customize deployment strategy

### Generated Files

After running the setup script, you'll have:
- `.env` - Environment variables for deployment
- `deployment-config.md` - Complete configuration summary
- Updated project files with your settings

## 📋 Manual Configuration Checklist

If you prefer to configure manually, here's what you need to set up:

### 1. GitHub Repository Information

**Required:**
- **GitHub Username/Organization**: Replace `your-github-username` in all files
- **Repository Name**: Default is `language-peer`, but you can change it

**Files to update:**
- `package.json` (repository URLs)
- `README.md` (GitHub links and badges)
- `docs/deployment-guide.md`
- `docs/automated-deployment.md`
- `src/infrastructure/app.ts`
- `src/infrastructure/stacks/demo-stack.ts`
- `scripts/setup-github-topics.sh`

### 2. AWS Configuration

**Required:**
- **AWS Credentials**: Configure using `aws configure`
- **AWS Region**: Default is `us-east-1`

**Optional:**
- **AWS Profile**: Set `AWS_PROFILE` environment variable if using profiles

### 3. Domain Names (Optional)

**Production Domain:**
- Example: `languagepeer.com`
- Used for production CORS origins and SSL certificates

**Staging Domain:**
- Example: `staging.languagepeer.com`
- Used for staging environment

**Files to update if using custom domains:**
- `src/infrastructure/config/environments.ts`

### 4. Environment Variables

Create a `.env` file in the project root:

```bash
# GitHub Configuration
GITHUB_OWNER=your-github-username
GITHUB_REPO=language-peer

# AWS Configuration
AWS_DEFAULT_REGION=us-east-1
AWS_PROFILE=default  # Optional

# Domain Configuration (Optional)
PROD_DOMAIN=languagepeer.com
STAGING_DOMAIN=staging.languagepeer.com

# Deployment Configuration
DEPLOY_ENVIRONMENTS="development staging production"
```

## 🔧 Detailed Configuration Steps

### Step 1: GitHub Repository Setup

1. **Create GitHub Repository** (if not exists):
   - Go to https://github.com/new
   - Repository name: `language-peer` (or your preferred name)
   - Make it public (required for GitHub Actions)
   - Initialize with README

2. **Update Repository References**:
   
   **In package.json:**
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/YOUR_USERNAME/language-peer.git"
     },
     "bugs": {
       "url": "https://github.com/YOUR_USERNAME/language-peer/issues"
     },
     "homepage": "https://github.com/YOUR_USERNAME/language-peer#readme"
   }
   ```

   **In README.md:**
   Replace all instances of `your-github-username` with your actual GitHub username.

   **In src/infrastructure/app.ts:**
   ```typescript
   githubOwner: process.env.GITHUB_OWNER || 'YOUR_USERNAME',
   githubRepo: process.env.GITHUB_REPO || 'language-peer',
   ```

### Step 2: AWS Credentials Configuration

1. **Install AWS CLI** (if not installed):
   ```bash
   # Windows (winget)
   winget install Amazon.AWSCLI
   
   # Windows (chocolatey)
   choco install awscli
   
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```
   
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (e.g., `json`)

3. **Verify Configuration**:
   ```bash
   aws sts get-caller-identity
   ```

### Step 3: Domain Configuration (Optional)

If you have custom domains, update `src/infrastructure/config/environments.ts`:

**For Production:**
```typescript
production: {
  // ... other config
  api: {
    throttlingRateLimit: 1000,
    throttlingBurstLimit: 2000,
    corsOrigins: ['https://yourdomain.com', 'https://app.yourdomain.com']
  },
  // ... rest of config
}
```

**For Staging:**
```typescript
staging: {
  // ... other config
  api: {
    throttlingRateLimit: 500,
    throttlingBurstLimit: 1000,
    corsOrigins: ['https://staging.yourdomain.com']
  },
  // ... rest of config
}
```

### Step 4: Environment-Specific Configuration

Choose which environments to deploy:

**Development Only** (recommended for testing):
```bash
DEPLOY_ENVIRONMENTS="development"
```

**Development + Staging**:
```bash
DEPLOY_ENVIRONMENTS="development staging"
```

**All Environments**:
```bash
DEPLOY_ENVIRONMENTS="development staging production"
```

## 🔍 Validation Checklist

Before deploying, verify:

- [ ] GitHub repository exists and is accessible
- [ ] All `your-github-username` placeholders are replaced
- [ ] AWS credentials are configured (`aws sts get-caller-identity` works)
- [ ] AWS region is set correctly
- [ ] Domain names are configured (if using custom domains)
- [ ] Environment variables are set in `.env` file

## 🚨 Common Issues and Solutions

### Issue: "Repository not found" during deployment

**Solution:**
- Ensure GitHub repository exists
- Make repository public
- Verify repository name matches configuration

### Issue: "AWS credentials not configured"

**Solution:**
```bash
aws configure
# Enter your AWS credentials
```

### Issue: "Access denied" for AWS services

**Solution:**
- Ensure your AWS user has the required permissions:
  - CloudFormation (full access)
  - IAM (full access)
  - S3 (full access)
  - Lambda (full access)
  - DynamoDB (full access)
  - API Gateway (full access)
  - Bedrock (model access)
  - Transcribe, Polly, Comprehend (full access)

### Issue: "Bedrock access denied"

**Solution:**
- Check if Bedrock is available in your region
- Request model access in AWS Console (Bedrock > Model access)
- Ensure IAM permissions for Bedrock

### Issue: Placeholder values still present

**Solution:**
- Run the setup script: `npm run setup`
- Or manually search and replace `your-github-username` in all files

## 🎯 Quick Start Commands

After configuration:

```bash
# 1. Run setup (if not done)
npm run setup

# 2. Deploy everything
npm run deploy:one-click

# 3. Or deploy step by step
npm run deploy:auto

# 4. Test deployment
npm run test:integration

# 5. Cleanup when done
npm run rollback
```

## 📚 Additional Resources

- [AWS CLI Configuration Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [GitHub Repository Setup](https://docs.github.com/en/get-started/quickstart/create-a-repo)
- [AWS Bedrock Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [Automated Deployment Guide](automated-deployment.md)

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting section](automated-deployment.md#troubleshooting) in the automated deployment guide
2. Review AWS CloudFormation console for detailed error messages
3. Check deployment logs in `deployment-*.log` files
4. Create a GitHub issue with error details and logs

---

**Next Step**: After configuration, proceed with [Automated Deployment](automated-deployment.md)