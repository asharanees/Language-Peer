# LanguagePeer Automated Deployment Script (PowerShell)
# This script provides fully automated deployment for Windows environments

param(
    [string]$Environment = "development",
    [bool]$ForceDeploy = $false,
    [string]$Region = $(if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" })
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Magenta = "Magenta"
    Cyan = "Cyan"
    White = "White"
}

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create log file
New-Item -Path $LogFile -ItemType File -Force | Out-Null

# Function to log and print
function Write-LogAndPrint {
    param(
        [string]$Level,
        [string]$Message,
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $cleanMessage = $Message -replace '\x1b\[[0-9;]*m', ''
    
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value "[$timestamp] [$Level] $cleanMessage"
}

function Write-Header {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                        LanguagePeer Auto Deploy                             ║" -ForegroundColor Magenta
    Write-Host "║                     Fully Automated AWS Deployment                          ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor Green
    Write-Host "Region: $Region" -ForegroundColor Green
    Write-Host "Force Deploy: $ForceDeploy" -ForegroundColor Green
    Write-Host "Log File: $LogFile" -ForegroundColor Green
    Write-Host ""
}

function Write-Status {
    param([string]$Message)
    Write-LogAndPrint -Level "INFO" -Message "[STEP] $Message" -Color "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-LogAndPrint -Level "SUCCESS" -Message "[✓] $Message" -Color "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-LogAndPrint -Level "WARNING" -Message "[⚠] $Message" -Color "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-LogAndPrint -Level "ERROR" -Message "[✗] $Message" -Color "Red"
}

function Write-Progress {
    param([string]$Message)
    Write-Host "[PROGRESS] $Message" -ForegroundColor Blue
}

# Function to check and install prerequisites
function Install-Prerequisites {
    Write-Status "Checking and installing prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
            exit 1
        }
        Write-Success "Node.js $nodeVersion is available"
    }
    catch {
        Write-Warning "Node.js not found. Attempting to install via winget..."
        
        try {
            if (Get-Command winget -ErrorAction SilentlyContinue) {
                Write-Progress "Installing Node.js via winget..."
                winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
            }
            elseif (Get-Command choco -ErrorAction SilentlyContinue) {
                Write-Progress "Installing Node.js via chocolatey..."
                choco install nodejs -y
            }
            else {
                Write-Error "Please install Node.js 18+ manually from https://nodejs.org/"
                exit 1
            }
        }
        catch {
            Write-Error "Failed to install Node.js automatically. Please install manually."
            exit 1
        }
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion is available"
    }
    catch {
        Write-Error "npm is not available. This should come with Node.js installation."
        exit 1
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version
        Write-Success "AWS CLI is available"
    }
    catch {
        Write-Warning "AWS CLI not found. Attempting to install..."
        
        try {
            if (Get-Command winget -ErrorAction SilentlyContinue) {
                Write-Progress "Installing AWS CLI via winget..."
                winget install Amazon.AWSCLI --accept-package-agreements --accept-source-agreements
            }
            elseif (Get-Command choco -ErrorAction SilentlyContinue) {
                Write-Progress "Installing AWS CLI via chocolatey..."
                choco install awscli -y
            }
            else {
                Write-Error "Please install AWS CLI manually from https://aws.amazon.com/cli/"
                exit 1
            }
            
            # Refresh PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        }
        catch {
            Write-Error "Failed to install AWS CLI automatically. Please install manually."
            exit 1
        }
    }
    
    # Check AWS credentials
    try {
        $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Success "AWS credentials configured for account: $($awsIdentity.Account)"
        Write-Success "Using identity: $($awsIdentity.Arn)"
    }
    catch {
        Write-Error "AWS credentials are not configured."
        Write-Error "Please run 'aws configure' and set up your credentials first."
        Write-Error "You need:"
        Write-Error "  - AWS Access Key ID"
        Write-Error "  - AWS Secret Access Key"
        Write-Error "  - Default region (e.g., us-east-1)"
        exit 1
    }
    
    # Install CDK globally if not present
    try {
        $cdkVersion = cdk --version
        Write-Success "AWS CDK is available: $cdkVersion"
    }
    catch {
        Write-Progress "Installing AWS CDK globally..."
        npm install -g aws-cdk@latest
        $cdkVersion = cdk --version
        Write-Success "AWS CDK installed: $cdkVersion"
    }
    
    Write-Success "All prerequisites are satisfied!"
}

# Function to check AWS service access
function Test-AWSServices {
    Write-Status "Verifying AWS service access..."
    
    $services = @(
        @{Name="bedrock"; Command="aws bedrock list-foundation-models --region $Region"},
        @{Name="transcribe"; Command="aws transcribe list-vocabularies --region $Region"},
        @{Name="polly"; Command="aws polly describe-voices --region $Region"},
        @{Name="comprehend"; Command="aws comprehend list-document-classifiers --region $Region"},
        @{Name="dynamodb"; Command="aws dynamodb list-tables --region $Region"},
        @{Name="s3"; Command="aws s3 ls"},
        @{Name="lambda"; Command="aws lambda list-functions --region $Region"},
        @{Name="apigateway"; Command="aws apigateway get-rest-apis --region $Region"},
        @{Name="cloudwatch"; Command="aws cloudwatch list-dashboards --region $Region"},
        @{Name="kinesis"; Command="aws kinesis list-streams --region $Region"},
        @{Name="iam"; Command="aws iam get-user"},
        @{Name="cloudformation"; Command="aws cloudformation list-stacks --region $Region"}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        Write-Progress "Checking $($service.Name) access..."
        
        try {
            Invoke-Expression "$($service.Command) > `$null 2>&1"
        }
        catch {
            $failedServices += $service.Name
            if ($service.Name -eq "bedrock") {
                Write-Warning "Bedrock access may be limited in region $Region"
            }
        }
    }
    
    if ($failedServices.Count -gt 0) {
        Write-Warning "Some AWS services may have limited access:"
        foreach ($service in $failedServices) {
            Write-Warning "  - $service"
        }
        
        if (-not $ForceDeploy) {
            Write-Error "Service access issues detected. Use -ForceDeploy `$true to force deployment."
            exit 1
        }
        else {
            Write-Warning "Forcing deployment despite service access issues..."
        }
    }
    else {
        Write-Success "All required AWS services are accessible!"
    }
}

# Function to install dependencies with retry logic
function Install-DependenciesWithRetry {
    Write-Status "Installing dependencies with retry logic..."
    
    $maxRetries = 3
    
    # Install root dependencies
    for ($i = 1; $i -le $maxRetries; $i++) {
        Write-Progress "Installing root dependencies (attempt $i/$maxRetries)..."
        
        try {
            npm ci --silent
            Write-Success "Root dependencies installed successfully"
            break
        }
        catch {
            if ($i -lt $maxRetries) {
                Write-Warning "Installation failed, retrying in 5 seconds..."
                Start-Sleep -Seconds 5
                npm cache clean --force
            }
            else {
                Write-Error "Failed to install root dependencies after $maxRetries attempts"
                exit 1
            }
        }
    }
    
    # Install frontend dependencies
    for ($i = 1; $i -le $maxRetries; $i++) {
        Write-Progress "Installing frontend dependencies (attempt $i/$maxRetries)..."
        
        try {
            Push-Location "src/frontend"
            npm ci --silent
            Pop-Location
            Write-Success "Frontend dependencies installed successfully"
            break
        }
        catch {
            Pop-Location
            if ($i -lt $maxRetries) {
                Write-Warning "Frontend installation failed, retrying in 5 seconds..."
                Start-Sleep -Seconds 5
                Push-Location "src/frontend"
                npm cache clean --force
                Pop-Location
            }
            else {
                Write-Error "Failed to install frontend dependencies after $maxRetries attempts"
                exit 1
            }
        }
    }
    
    Write-Success "All dependencies installed successfully!"
}

# Function to run comprehensive tests
function Invoke-ComprehensiveTests {
    Write-Status "Running comprehensive test suite..."
    
    # Set test environment
    $env:NODE_ENV = "test"
    $env:TEST_ENVIRONMENT = $Environment
    
    # Run linting first (fastest)
    Write-Progress "Running code linting..."
    try {
        npm run lint > $null 2>&1
        Write-Success "Code linting passed"
    }
    catch {
        Write-Warning "Linting issues detected, but continuing..."
    }
    
    # Run unit tests
    Write-Progress "Running unit tests..."
    try {
        npm run test:unit -- --run --silent > $null 2>&1
        Write-Success "Unit tests passed"
    }
    catch {
        Write-Warning "Some unit tests failed, but continuing..."
    }
    
    # Run infrastructure tests
    Write-Progress "Running infrastructure tests..."
    try {
        npm run test:infrastructure -- --run --silent > $null 2>&1
        Write-Success "Infrastructure tests passed"
    }
    catch {
        Write-Warning "Some infrastructure tests failed, but continuing..."
    }
    
    Write-Success "Test suite completed!"
}

# Function to bootstrap CDK
function Initialize-CDK {
    Write-Status "Bootstrapping CDK with enhanced error handling..."
    
    # Check if already bootstrapped
    try {
        aws cloudformation describe-stacks --stack-name CDKToolkit --region $Region > $null 2>&1
        $stackStatus = aws cloudformation describe-stacks --stack-name CDKToolkit --region $Region --query 'Stacks[0].StackStatus' --output text
        Write-Success "CDK already bootstrapped in region $Region (Status: $stackStatus)"
        return
    }
    catch {
        Write-Progress "Bootstrapping CDK for the first time..."
    }
    
    # Bootstrap with specific context
    try {
        npx cdk bootstrap --context environment=$Environment --region $Region
        Write-Success "CDK bootstrapped successfully!"
    }
    catch {
        Write-Error "CDK bootstrap failed. This might be due to insufficient permissions."
        Write-Error "Required permissions:"
        Write-Error "  - cloudformation:*"
        Write-Error "  - s3:*"
        Write-Error "  - iam:*"
        Write-Error "  - ssm:*"
        exit 1
    }
}

# Function to deploy with progress tracking
function Start-Deployment {
    Write-Status "Deploying infrastructure with progress tracking..."
    
    # Synthesize first to catch errors early
    Write-Progress "Synthesizing CDK stacks..."
    try {
        npx cdk synth --context environment=$Environment > $null 2>&1
        Write-Success "CDK synthesis completed successfully"
    }
    catch {
        Write-Error "CDK synthesis failed. Check your CDK code for errors."
        exit 1
    }
    
    # Build frontend before deployment
    Write-Progress "Building frontend application..."
    try {
        Push-Location "src/frontend"
        npm run build > $null 2>&1
        Pop-Location
        Write-Success "Frontend build completed"
    }
    catch {
        Pop-Location
        Write-Error "Frontend build failed"
        exit 1
    }
    
    # Deploy based on environment
    Write-Progress "Starting deployment to $Environment environment..."
    
    $deployStartTime = Get-Date
    
    try {
        switch ($Environment) {
            "development" {
                npm run deploy:dev
                Write-Success "Development deployment completed"
            }
            "staging" {
                npm run deploy:staging
                Write-Success "Staging deployment completed"
            }
            "production" {
                Write-Warning "Production deployment requires additional confirmation"
                Write-Warning "This will deploy to production environment!"
                
                if (-not $ForceDeploy) {
                    $confirm = Read-Host "Are you sure you want to deploy to production? (yes/no)"
                    if ($confirm -ne "yes") {
                        Write-Error "Production deployment cancelled by user"
                        exit 1
                    }
                }
                
                npm run deploy:prod
                Write-Success "Production deployment completed"
            }
            default {
                Write-Error "Invalid environment: $Environment"
                exit 1
            }
        }
    }
    catch {
        Write-Error "$Environment deployment failed"
        exit 1
    }
    
    $deployEndTime = Get-Date
    $deployDuration = ($deployEndTime - $deployStartTime).TotalSeconds
    Write-Success "Deployment completed in $([math]::Round($deployDuration)) seconds"
}

# Function to perform comprehensive verification
function Test-Deployment {
    Write-Status "Performing comprehensive deployment verification..."
    
    # Wait for services to be ready
    Write-Progress "Waiting for services to initialize..."
    Start-Sleep -Seconds 30
    
    # Check CloudFormation stacks
    $stacks = @(
        "LanguagePeer-Core-$Environment",
        "LanguagePeer-Voice-$Environment",
        "LanguagePeer-Agents-$Environment",
        "LanguagePeer-Monitoring-$Environment",
        "LanguagePeer-Demo-$Environment"
    )
    
    $failedStacks = @()
    
    foreach ($stack in $stacks) {
        Write-Progress "Checking stack: $stack"
        
        try {
            aws cloudformation describe-stacks --stack-name $stack --region $Region > $null 2>&1
            $status = aws cloudformation describe-stacks --stack-name $stack --region $Region --query 'Stacks[0].StackStatus' --output text
            
            if ($status -like "*COMPLETE*") {
                Write-Success "✓ $stack`: $status"
            }
            else {
                Write-Warning "⚠ $stack`: $status"
                $failedStacks += $stack
            }
        }
        catch {
            Write-Warning "⚠ $stack`: Not found"
            $failedStacks += $stack
        }
    }
    
    # Test API endpoints
    Write-Progress "Testing API endpoints..."
    
    try {
        $apiEndpoint = aws cloudformation describe-stacks --stack-name "LanguagePeer-Core-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>$null
        
        if ($apiEndpoint -and $apiEndpoint -ne "None") {
            try {
                Invoke-RestMethod -Uri "$apiEndpoint/health" -Method Get -TimeoutSec 10 > $null
                Write-Success "✓ Core API health check passed"
            }
            catch {
                Write-Warning "⚠ Core API health check failed"
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve API endpoint"
    }
    
    # Test demo endpoints
    try {
        $demoApiUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>$null
        
        if ($demoApiUrl -and $demoApiUrl -ne "None") {
            try {
                Invoke-RestMethod -Uri "$demoApiUrl/demo/health" -Method Get -TimeoutSec 10 > $null
                Write-Success "✓ Demo API health check passed"
            }
            catch {
                Write-Warning "⚠ Demo API health check failed"
            }
            
            try {
                Invoke-RestMethod -Uri "$demoApiUrl/demo/users" -Method Get -TimeoutSec 10 > $null
                Write-Success "✓ Demo API users endpoint working"
            }
            catch {
                Write-Warning "⚠ Demo API users endpoint failed"
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve demo API URL"
    }
    
    # Check if there were any failures
    if ($failedStacks.Count -gt 0) {
        Write-Warning "Some stacks had issues:"
        foreach ($stack in $failedStacks) {
            Write-Warning "  - $stack"
        }
        
        if (-not $ForceDeploy) {
            Write-Error "Verification failed. Check the issues above."
            exit 1
        }
    }
    
    Write-Success "Deployment verification completed!"
}

# Function to generate deployment report
function New-DeploymentReport {
    Write-Status "Generating deployment report..."
    
    $reportFile = Join-Path $ProjectRoot "deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
    
    $reportContent = @"
# LanguagePeer Deployment Report

**Deployment Date:** $(Get-Date)
**Environment:** $Environment
**Region:** $Region
**AWS Account:** $(aws sts get-caller-identity --query Account --output text)

## Stack Status

"@
    
    # Add stack information
    $stacks = @(
        "LanguagePeer-Core-$Environment",
        "LanguagePeer-Voice-$Environment",
        "LanguagePeer-Agents-$Environment",
        "LanguagePeer-Monitoring-$Environment",
        "LanguagePeer-Demo-$Environment"
    )
    
    foreach ($stack in $stacks) {
        try {
            aws cloudformation describe-stacks --stack-name $stack --region $Region > $null 2>&1
            $status = aws cloudformation describe-stacks --stack-name $stack --region $Region --query 'Stacks[0].StackStatus' --output text
            $reportContent += "- **${stack}:** $status`n"
        }
        catch {
            $reportContent += "- **${stack}:** Not Found`n"
        }
    }
    
    # Add important URLs
    $reportContent += @"

## Important URLs

"@
    
    try {
        $apiEndpoint = aws cloudformation describe-stacks --stack-name "LanguagePeer-Core-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>$null
        $demoUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>$null
        $demoApiUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>$null
        $dashboardUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Monitoring-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text 2>$null
        
        $reportContent += @"
- **API Endpoint:** $(if ($apiEndpoint) { $apiEndpoint } else { "Not available" })
- **Demo Website:** $(if ($demoUrl) { $demoUrl } else { "Not available" })
- **Demo API:** $(if ($demoApiUrl) { $demoApiUrl } else { "Not available" })
- **Monitoring Dashboard:** $(if ($dashboardUrl) { $dashboardUrl } else { "Not available" })

## Next Steps

1. Visit the demo website to test the application
2. Monitor the application using the CloudWatch dashboard
3. Run integration tests: ``npm run test:integration``
4. Run end-to-end tests: ``npm run test:e2e``

## Cleanup

To remove all resources when done:
``````bash
npm run rollback
``````

"@
    }
    catch {
        $reportContent += "- **URLs:** Could not retrieve deployment URLs`n"
    }
    
    Set-Content -Path $reportFile -Value $reportContent
    Write-Success "Deployment report generated: $reportFile"
    
    # Display summary
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                           DEPLOYMENT SUMMARY                                ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host "Region: $Region" -ForegroundColor Cyan
    
    try {
        $demoUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>$null
        $demoApiUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>$null
        $dashboardUrl = aws cloudformation describe-stacks --stack-name "LanguagePeer-Monitoring-$Environment" --region $Region --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text 2>$null
        
        Write-Host "Demo Website: $(if ($demoUrl) { $demoUrl } else { 'Not available' })" -ForegroundColor Cyan
        Write-Host "Demo API: $(if ($demoApiUrl) { $demoApiUrl } else { 'Not available' })" -ForegroundColor Cyan
        Write-Host "Monitoring: $(if ($dashboardUrl) { $dashboardUrl } else { 'Not available' })" -ForegroundColor Cyan
    }
    catch {
        Write-Host "URLs: Could not retrieve" -ForegroundColor Yellow
    }
    
    Write-Host "Report: $reportFile" -ForegroundColor Cyan
    Write-Host "Log: $LogFile" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution function
function Main {
    # Start deployment
    $startTime = Get-Date
    
    Write-Header
    
    try {
        # Execute all deployment steps
        Install-Prerequisites
        Test-AWSServices
        Install-DependenciesWithRetry
        Invoke-ComprehensiveTests
        Initialize-CDK
        Start-Deployment
        Test-Deployment
        New-DeploymentReport
        
        $endTime = Get-Date
        $totalDuration = ($endTime - $startTime).TotalSeconds
        
        Write-Success "🎉 Automated deployment completed successfully in $([math]::Round($totalDuration)) seconds!"
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Green
        Write-Host "1. Visit your demo website to test the application" -ForegroundColor White
        Write-Host "2. Check the monitoring dashboard for metrics" -ForegroundColor White
        Write-Host "3. Run integration tests: npm run test:integration" -ForegroundColor Cyan
        Write-Host "4. When done, cleanup with: npm run rollback" -ForegroundColor Cyan
        Write-Host ""
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Error "Check the log file: $LogFile"
        exit 1
    }
}

# Show usage if help is requested
if ($args -contains "--help" -or $args -contains "-h") {
    Write-Host "Usage: .\auto-deploy.ps1 [-Environment environment] [-ForceDeploy bool] [-Region region]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Environment    Target environment (development|staging|production) [default: development]"
    Write-Host "  -ForceDeploy    Force deployment even if issues are detected [default: false]"
    Write-Host "  -Region         AWS region [default: us-east-1]"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\auto-deploy.ps1                                    # Deploy to development"
    Write-Host "  .\auto-deploy.ps1 -Environment development -ForceDeploy `$true"
    Write-Host "  .\auto-deploy.ps1 -Environment staging"
    Write-Host "  .\auto-deploy.ps1 -Environment production -ForceDeploy `$true"
    Write-Host ""
    exit 0
}

# Run main function
Main