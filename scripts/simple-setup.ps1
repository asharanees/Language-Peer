# Simple LanguagePeer Configuration Setup Script
# This script helps you configure the basic inputs needed for deployment

Write-Host "LanguagePeer Configuration Setup" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Collect GitHub information
Write-Host "GitHub Configuration" -ForegroundColor Blue
Write-Host "-------------------" -ForegroundColor Blue
$GITHUB_OWNER = Read-Host "Enter your GitHub username/organization"
while ([string]::IsNullOrWhiteSpace($GITHUB_OWNER)) {
    Write-Host "GitHub username is required." -ForegroundColor Red
    $GITHUB_OWNER = Read-Host "Enter your GitHub username/organization"
}

$GITHUB_REPO = Read-Host "Enter repository name (default: language-peer)"
if ([string]::IsNullOrWhiteSpace($GITHUB_REPO)) {
    $GITHUB_REPO = "language-peer"
}

# Collect AWS information
Write-Host ""
Write-Host "AWS Configuration" -ForegroundColor Blue
Write-Host "----------------" -ForegroundColor Blue
$AWS_REGION = Read-Host "Enter AWS region (default: us-east-1)"
if ([string]::IsNullOrWhiteSpace($AWS_REGION)) {
    $AWS_REGION = "us-east-1"
}

# Optional domain configuration
Write-Host ""
Write-Host "Domain Configuration (Optional)" -ForegroundColor Blue
Write-Host "------------------------------" -ForegroundColor Blue
Write-Host "Press Enter to skip if you don't have custom domains" -ForegroundColor Yellow
$PROD_DOMAIN = Read-Host "Production domain (e.g., languagepeer.com)"
$STAGING_DOMAIN = Read-Host "Staging domain (e.g., staging.languagepeer.com)"

# Create .env file
Write-Host ""
Write-Host "Creating configuration files..." -ForegroundColor Blue

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
DEPLOY_ENVIRONMENTS="development"
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "Created .env file" -ForegroundColor Green

# Update package.json
Write-Host "Updating package.json..." -ForegroundColor Blue
$packageJson = Get-Content "package.json" -Raw
$packageJson = $packageJson -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "package.json" -Value $packageJson
Write-Host "Updated package.json" -ForegroundColor Green

# Update README.md
Write-Host "Updating README.md..." -ForegroundColor Blue
$readme = Get-Content "README.md" -Raw
$readme = $readme -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "README.md" -Value $readme
Write-Host "Updated README.md" -ForegroundColor Green

# Update infrastructure files
Write-Host "Updating infrastructure files..." -ForegroundColor Blue
$appTs = Get-Content "src/infrastructure/app.ts" -Raw
$appTs = $appTs -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "src/infrastructure/app.ts" -Value $appTs

$demoStack = Get-Content "src/infrastructure/stacks/demo-stack.ts" -Raw
$demoStack = $demoStack -replace "your-github-username", $GITHUB_OWNER
Set-Content -Path "src/infrastructure/stacks/demo-stack.ts" -Value $demoStack
Write-Host "Updated infrastructure files" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "Configuration Summary" -ForegroundColor Magenta
Write-Host "====================" -ForegroundColor Magenta
Write-Host "GitHub Repository: https://github.com/$GITHUB_OWNER/$GITHUB_REPO" -ForegroundColor Green
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Green
if ($PROD_DOMAIN) {
    Write-Host "Production Domain: $PROD_DOMAIN" -ForegroundColor Green
}
if ($STAGING_DOMAIN) {
    Write-Host "Staging Domain: $STAGING_DOMAIN" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "1. Configure AWS credentials: aws configure" -ForegroundColor White
Write-Host "2. Create GitHub repository if it doesn't exist" -ForegroundColor White
Write-Host "3. Deploy: npm run deploy:auto" -ForegroundColor White
Write-Host ""
Write-Host "Configuration completed successfully!" -ForegroundColor Green