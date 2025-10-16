# LanguagePeer Configuration Setup Script (PowerShell)
# This script helps you configure all the manual inputs needed for deployment

param(
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "LanguagePeer Configuration Setup Script"
    Write-Host "======================================"
    Write-Host ""
    Write-Host "This script helps you configure:"
    Write-Host "1. GitHub repository information"
    Write-Host "2. AWS configuration"
    Write-Host "3. Domain names (optional)"
    Write-Host "4. Environment-specific settings"
    Write-Host ""
    Write-Host "Usage: .\setup-config.ps1"
    Write-Host ""
    exit 0
}

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    LanguagePeer Configuration Setup                         ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Function to prompt for input with default value
function Get-InputWithDefault {
    param(
        [string]$Prompt,
        [string]$Default = "",
        [bool]$Required = $false
    )
    
    Write-Host $Prompt -ForegroundColor Blue
    if ($Default) {
        Write-Host "Default: $Default" -ForegroundColor Yellow
        $userInput = Read-Host "Enter value (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($userInput)) {
            $userInput = $Default
        }
    } else {
        do {
            $userInput = Read-Host "Enter value"
            if ([string]::IsNullOrWhiteSpace($userInput) -and $Required) {
                Write-Host "This field is required." -ForegroundColor Red
            }
        } while ([string]::IsNullOrWhiteSpace($userInput) -and $Required)
    }
    
    return $userInput
}

# Function to validate GitHub repository
function Test-GitHubRepository {
    param(
        [string]$Owner,
        [string]$Repo
    )
    
    Write-Host "Validating GitHub repository..." -ForegroundColor Blue
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo" -Method Get -TimeoutSec 10
        Write-Host "✓ Repository $Owner/$Repo exists and is accessible" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "⚠ Repository $Owner/$Repo may not exist or is not public" -ForegroundColor Yellow
        Write-Host "  You can continue, but make sure to create the repository later" -ForegroundColor Yellow
        return $false
    }
}

# Function to validate AWS credentials
function Test-AWSCredentials {
    Write-Host "Validating AWS credentials..." -ForegroundColor Blue
    
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Host "✓ AWS credentials are valid" -ForegroundColor Green
        Write-Host "  Account: $($identity.Account)" -ForegroundColor Green
        Write-Host "  User: $($identity.Arn)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ AWS credentials are not configured" -ForegroundColor Red
        Write-Host "  Please run 'aws configure' to set up your credentials" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "This script will help you configure the following:" -ForegroundColor Blue
Write-Host "1. GitHub repository information"
Write-Host "2. AWS configuration"
Write-Host "3. Domain names (optional)"
Write-Host "4. Environment-specific settings"
Write-Host ""

# Collect GitHub information
Write-Host "=== GitHub Configuration ===" -ForegroundColor Magenta
$GITHUB_OWNER = Get-InputWithDefault -Prompt "GitHub Username/Organization:" -Required $true
$GITHUB_REPO = Get-InputWithDefault -Prompt "Repository Name:" -Default "language-peer"

# Validate GitHub repository
Test-GitHubRepository -Owner $GITHUB_OWNER -Repo $GITHUB_REPO

# Collect AWS information
Write-Host ""
Write-Host "=== AWS Configuration ===" -ForegroundColor Magenta
$AWS_REGION = Get-InputWithDefault -Prompt "AWS Region:" -Default "us-east-1"

# Validate AWS credentials
Test-AWSCredentials

# Collect domain information (optional)
Write-Host ""
Write-Host "=== Domain Configuration (Optional) ===" -ForegroundColor Magenta
Write-Host "If you have custom domains, enter them. Otherwise, press Enter to skip." -ForegroundColor Yellow
$PROD_DOMAIN = Get-InputWithDefault -Prompt "Production Domain (e.g., languagepeer.com):" -Default ""
$STAGING_DOMAIN = Get-InputWithDefault -Prompt "Staging Domain (e.g., staging.languagepeer.com):" -Default ""

# Environment-specific questions
Write-Host ""
Write-Host "=== Environment Configuration ===" -ForegroundColor Magenta
Write-Host "Which environments do you want to deploy?" -ForegroundColor Blue
Write-Host "1. Development only (recommended for testing)"
Write-Host "2. Development + Staging"
Write-Host "3. All environments (Development + Staging + Production)"
$env_choice = Read-Host "Choose option (1-3)"

switch ($env_choice) {
    "1" { $DEPLOY_ENVS = "development" }
    "2" { $DEPLOY_ENVS = "development staging" }
    "3" { $DEPLOY_ENVS = "development staging production" }
    default { $DEPLOY_ENVS = "development" }
}

# Create configuration files
Write-Host ""
Write-Host "Creating configuration files..." -ForegroundColor Blue

# Create .env file
$envContent = @"
# LanguagePeer Configuration
# Generated on $(Get-Date)

# GitHub Configuration
GITHUB_OWNER=$GITHUB_OWNER
GITHUB_REPO=$GITHUB_REPO

# AWS Configuration
AWS_DEFAULT_REGION=$AWS_REGION

# Domain Configuration
PROD_DOMAIN=$PROD_DOMAIN
STAGING_DOMAIN=$STAGING_DOMAIN

# Deployment Configuration
DEPLOY_ENVIRONMENTS="$DEPLOY_ENVS"
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "Created .env file" -ForegroundColor Green

# Update package.json with correct repository URLs
Write-Host "Updating package.json..." -ForegroundColor Blue
$packageJson = Get-Content "package.json" -Raw
$packageJson = $packageJson -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "package.json" -Value $packageJson
Write-Host "✓ Updated package.json" -ForegroundColor Green

# Update README.md
Write-Host "Updating README.md..." -ForegroundColor Blue
$readme = Get-Content "README.md" -Raw
$readme = $readme -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "README.md" -Value $readme
Write-Host "✓ Updated README.md" -ForegroundColor Green

# Update deployment guide
Write-Host "Updating deployment documentation..." -ForegroundColor Blue
$deployGuide = Get-Content "docs/deployment-guide.md" -Raw
$deployGuide = $deployGuide -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "docs/deployment-guide.md" -Value $deployGuide

$autoDeployGuide = Get-Content "docs/automated-deployment.md" -Raw
$autoDeployGuide = $autoDeployGuide -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "docs/automated-deployment.md" -Value $autoDeployGuide
Write-Host "✓ Updated documentation" -ForegroundColor Green

# Update infrastructure files
Write-Host "Updating infrastructure configuration..." -ForegroundColor Blue
$appTs = Get-Content "src/infrastructure/app.ts" -Raw
$appTs = $appTs -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "src/infrastructure/app.ts" -Value $appTs

$demoStack = Get-Content "src/infrastructure/stacks/demo-stack.ts" -Raw
$demoStack = $demoStack -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "src/infrastructure/stacks/demo-stack.ts" -Value $demoStack

$setupTopics = Get-Content "scripts/setup-github-topics.sh" -Raw
$setupTopics = $setupTopics -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "scripts/setup-github-topics.sh" -Value $setupTopics
Write-Host "✓ Updated infrastructure files" -ForegroundColor Green

# Update domain configurations if provided
if ($PROD_DOMAIN -or $STAGING_DOMAIN) {
    Write-Host "Updating domain configurations..." -ForegroundColor Blue
    
    $envConfig = Get-Content "src/infrastructure/config/environments.ts" -Raw
    
    if ($PROD_DOMAIN) {
        $envConfig = $envConfig -replace "https://languagepeer.com", "https://$PROD_DOMAIN"
        $envConfig = $envConfig -replace "https://app.languagepeer.com", "https://app.$PROD_DOMAIN"
    }
    
    if ($STAGING_DOMAIN) {
        $envConfig = $envConfig -replace "https://staging.languagepeer.com", "https://$STAGING_DOMAIN"
    }
    
    Set-Content -Path "src/infrastructure/config/environments.ts" -Value $envConfig
    Write-Host "✓ Updated domain configurations" -ForegroundColor Green
}

# Create deployment summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                           CONFIGURATION SUMMARY                             ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "GitHub Repository: https://github.com/$GITHUB_OWNER/$GITHUB_REPO" -ForegroundColor Green
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Green
if ($PROD_DOMAIN) {
    Write-Host "Production Domain: $PROD_DOMAIN" -ForegroundColor Green
}
if ($STAGING_DOMAIN) {
    Write-Host "Staging Domain: $STAGING_DOMAIN" -ForegroundColor Green
}
Write-Host "Deployment Environments: $DEPLOY_ENVS" -ForegroundColor Green
Write-Host ""

# Create next steps
Write-Host "=== Next Steps ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Review Configuration:" -ForegroundColor Blue
Write-Host "   - Check the generated .env file"
Write-Host "   - Verify all placeholders have been replaced"
Write-Host ""
Write-Host "2. Set up GitHub Repository (if not exists):" -ForegroundColor Blue
Write-Host "   - Create repository: https://github.com/new"
Write-Host "   - Repository name: $GITHUB_REPO"
Write-Host "   - Make it public for GitHub Actions"
Write-Host ""
Write-Host "3. Configure AWS Credentials (if not done):" -ForegroundColor Blue
Write-Host "   - Run: aws configure"
Write-Host "   - Enter your AWS Access Key ID and Secret"
Write-Host ""
Write-Host "4. Deploy the Application:" -ForegroundColor Blue
Write-Host "   - Quick deploy: npm run deploy:one-click"
Write-Host "   - Or PowerShell: .\scripts\auto-deploy.ps1"
Write-Host ""
Write-Host "5. Set up CI/CD (optional):" -ForegroundColor Blue
Write-Host "   - Push code to GitHub"
Write-Host "   - Configure GitHub Secrets for AWS credentials"
Write-Host "   - GitHub Actions will handle automatic deployments"
Write-Host ""

# Save configuration for later reference
$configContent = @"
# LanguagePeer Deployment Configuration

Generated on: $(Get-Date)

## Configuration Summary

- **GitHub Repository**: https://github.com/$GITHUB_OWNER/$GITHUB_REPO
- **AWS Region**: $AWS_REGION
- **Production Domain**: $(if ($PROD_DOMAIN) { $PROD_DOMAIN } else { "Not configured" })
- **Staging Domain**: $(if ($STAGING_DOMAIN) { $STAGING_DOMAIN } else { "Not configured" })
- **Deployment Environments**: $DEPLOY_ENVS

## Environment Variables

The following environment variables have been configured in .env:

``````bash
GITHUB_OWNER=$GITHUB_OWNER
GITHUB_REPO=$GITHUB_REPO
AWS_DEFAULT_REGION=$AWS_REGION
PROD_DOMAIN=$PROD_DOMAIN
STAGING_DOMAIN=$STAGING_DOMAIN
DEPLOY_ENVIRONMENTS="$DEPLOY_ENVS"
``````

## Files Updated

- package.json (repository URLs)
- README.md (GitHub links and badges)
- docs/deployment-guide.md (GitHub references)
- docs/automated-deployment.md (GitHub references)
- src/infrastructure/app.ts (GitHub configuration)
- src/infrastructure/stacks/demo-stack.ts (GitHub links)
- src/infrastructure/config/environments.ts (domain configuration)

## Next Steps

1. Review all updated files
2. Create GitHub repository if it doesn't exist
3. Configure AWS credentials: ``aws configure``
4. Deploy: ``npm run deploy:one-click`` or ``.\scripts\auto-deploy.ps1``

## Troubleshooting

If you need to reconfigure:
1. Delete .env file
2. Run this script again: ``.\scripts\setup-config.ps1``

For deployment issues, check:
- AWS credentials: ``aws sts get-caller-identity``
- GitHub repository exists and is accessible
- All required AWS services are available in your region
"@

Set-Content -Path "deployment-config.md" -Value $configContent
Write-Host "✓ Configuration summary saved to deployment-config.md" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Configuration setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to deploy? Run: " -NoNewline -ForegroundColor Yellow
Write-Host "npm run deploy:one-click" -ForegroundColor Green