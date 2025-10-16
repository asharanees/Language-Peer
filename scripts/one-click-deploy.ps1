# LanguagePeer One-Click Deployment (PowerShell)
# The simplest way to deploy LanguagePeer on Windows

Write-Host "🚀 LanguagePeer One-Click Deploy" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue
Write-Host ""

# Check if this is the first run
if (-not (Test-Path ".deployment-initialized")) {
    Write-Host "First-time setup detected. This will:" -ForegroundColor Yellow
    Write-Host "1. Install all prerequisites automatically"
    Write-Host "2. Configure AWS CDK"
    Write-Host "3. Deploy to development environment"
    Write-Host "4. Run basic tests"
    Write-Host ""
    
    $continue = Read-Host "Continue? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled."
        exit 1
    }
    
    # Mark as initialized
    New-Item -Path ".deployment-initialized" -ItemType File | Out-Null
}

Write-Host "Starting automated deployment..." -ForegroundColor Green
Write-Host ""

# Run the full automated deployment
if (Test-Path "scripts/auto-deploy.ps1") {
    & ".\scripts\auto-deploy.ps1" -Environment "development" -ForceDeploy $false
}
else {
    Write-Host "Error: auto-deploy.ps1 not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 One-click deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick commands:" -ForegroundColor Blue
Write-Host "  Test the app: npm run test:integration" -ForegroundColor Yellow
Write-Host "  View logs:    aws logs describe-log-groups --log-group-name-prefix '/aws/languagepeer'" -ForegroundColor Yellow
Write-Host "  Cleanup:      npm run rollback" -ForegroundColor Yellow
Write-Host ""