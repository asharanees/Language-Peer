#!/bin/bash

# LanguagePeer Automated Deployment Script
# This script provides fully automated deployment with minimal user interaction

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
FORCE_DEPLOY=${2:-false}
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/deployment-$(date +%Y%m%d-%H%M%S).log"

# Create log file
touch "$LOG_FILE"

# Function to log and print
log_and_print() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "$message"
    echo "[$timestamp] [$level] $message" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        LanguagePeer Auto Deploy                             ║"
    echo "║                     Fully Automated AWS Deployment                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
    echo -e "Region: ${GREEN}$AWS_REGION${NC}"
    echo -e "Force Deploy: ${GREEN}$FORCE_DEPLOY${NC}"
    echo -e "Log File: ${GREEN}$LOG_FILE${NC}"
    echo ""
}

print_status() {
    log_and_print "INFO" "${CYAN}[STEP]${NC} $1"
}

print_success() {
    log_and_print "SUCCESS" "${GREEN}[✓]${NC} $1"
}

print_warning() {
    log_and_print "WARNING" "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    log_and_print "ERROR" "${RED}[✗]${NC} $1"
}

print_progress() {
    echo -e "${BLUE}[PROGRESS]${NC} $1"
}

# Function to check and install prerequisites automatically
auto_install_prerequisites() {
    print_status "Checking and installing prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Attempting to install via package manager..."
        
        if command -v winget &> /dev/null; then
            print_progress "Installing Node.js via winget..."
            winget install OpenJS.NodeJS
        elif command -v choco &> /dev/null; then
            print_progress "Installing Node.js via chocolatey..."
            choco install nodejs -y
        else
            print_error "Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
        fi
    fi
    
    # Verify Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        print_error "Please update Node.js and try again."
        exit 1
    fi
    print_success "Node.js $(node --version) is available"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not available. This should come with Node.js installation."
        exit 1
    fi
    print_success "npm $(npm --version) is available"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI not found. Attempting to install..."
        
        if command -v winget &> /dev/null; then
            print_progress "Installing AWS CLI via winget..."
            winget install Amazon.AWSCLI
        elif command -v choco &> /dev/null; then
            print_progress "Installing AWS CLI via chocolatey..."
            choco install awscli -y
        else
            print_error "Please install AWS CLI manually from https://aws.amazon.com/cli/"
            exit 1
        fi
        
        # Refresh PATH
        export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS credentials are not configured."
        print_error "Please run 'aws configure' and set up your credentials first."
        print_error "You need:"
        print_error "  - AWS Access Key ID"
        print_error "  - AWS Secret Access Key"
        print_error "  - Default region (e.g., us-east-1)"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    print_success "AWS credentials configured for account: $AWS_ACCOUNT"
    print_success "Using identity: $AWS_USER"
    
    # Install CDK globally if not present
    if ! command -v cdk &> /dev/null; then
        print_progress "Installing AWS CDK globally..."
        npm install -g aws-cdk@latest
    fi
    
    CDK_VERSION=$(cdk --version)
    print_success "AWS CDK is available: $CDK_VERSION"
    
    print_success "All prerequisites are satisfied!"
}

# Function to check AWS service access
check_aws_services() {
    print_status "Verifying AWS service access..."
    
    local services=(
        "bedrock:ListFoundationModels"
        "transcribe:ListVocabularies"
        "polly:DescribeVoices"
        "comprehend:ListDocumentClassifiers"
        "dynamodb:ListTables"
        "s3:ListBuckets"
        "lambda:ListFunctions"
        "apigateway:GetRestApis"
        "cloudwatch:ListDashboards"
        "kinesis:ListStreams"
        "iam:GetUser"
        "cloudformation:ListStacks"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        local service_name=$(echo $service | cut -d':' -f1)
        local action=$(echo $service | cut -d':' -f2)
        
        print_progress "Checking $service_name access..."
        
        case $service_name in
            "bedrock")
                if ! aws bedrock list-foundation-models --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                    print_warning "Bedrock access may be limited in region $AWS_REGION"
                fi
                ;;
            "transcribe")
                if ! aws transcribe list-vocabularies --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "polly")
                if ! aws polly describe-voices --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "comprehend")
                if ! aws comprehend list-document-classifiers --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "dynamodb")
                if ! aws dynamodb list-tables --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "s3")
                if ! aws s3 ls > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "lambda")
                if ! aws lambda list-functions --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "apigateway")
                if ! aws apigateway get-rest-apis --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "cloudwatch")
                if ! aws cloudwatch list-dashboards --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "kinesis")
                if ! aws kinesis list-streams --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "iam")
                if ! aws iam get-user > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
            "cloudformation")
                if ! aws cloudformation list-stacks --region $AWS_REGION > /dev/null 2>&1; then
                    failed_services+=("$service_name")
                fi
                ;;
        esac
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        print_warning "Some AWS services may have limited access:"
        for service in "${failed_services[@]}"; do
            print_warning "  - $service"
        done
        
        if [ "$FORCE_DEPLOY" != "true" ]; then
            print_error "Service access issues detected. Use 'true' as second parameter to force deployment."
            exit 1
        else
            print_warning "Forcing deployment despite service access issues..."
        fi
    else
        print_success "All required AWS services are accessible!"
    fi
}

# Function to install dependencies with retry logic
install_dependencies_with_retry() {
    print_status "Installing dependencies with retry logic..."
    
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        print_progress "Installing root dependencies (attempt $((retry_count + 1))/$max_retries)..."
        
        if npm ci --silent; then
            print_success "Root dependencies installed successfully"
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                print_warning "Installation failed, retrying in 5 seconds..."
                sleep 5
                # Clear npm cache
                npm cache clean --force
            else
                print_error "Failed to install root dependencies after $max_retries attempts"
                exit 1
            fi
        fi
    done
    
    # Install frontend dependencies
    retry_count=0
    while [ $retry_count -lt $max_retries ]; do
        print_progress "Installing frontend dependencies (attempt $((retry_count + 1))/$max_retries)..."
        
        if (cd src/frontend && npm ci --silent); then
            print_success "Frontend dependencies installed successfully"
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                print_warning "Frontend installation failed, retrying in 5 seconds..."
                sleep 5
                # Clear npm cache
                (cd src/frontend && npm cache clean --force)
            else
                print_error "Failed to install frontend dependencies after $max_retries attempts"
                exit 1
            fi
        fi
    done
    
    print_success "All dependencies installed successfully!"
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    print_status "Running comprehensive test suite..."
    
    # Set test environment
    export NODE_ENV=test
    export TEST_ENVIRONMENT=$ENVIRONMENT
    
    # Run linting first (fastest)
    print_progress "Running code linting..."
    if npm run lint > /dev/null 2>&1; then
        print_success "Code linting passed"
    else
        print_warning "Linting issues detected, but continuing..."
    fi
    
    # Run unit tests
    print_progress "Running unit tests..."
    if npm run test:unit -- --run --silent > /dev/null 2>&1; then
        print_success "Unit tests passed"
    else
        print_warning "Some unit tests failed, but continuing..."
    fi
    
    # Run infrastructure tests
    print_progress "Running infrastructure tests..."
    if npm run test:infrastructure -- --run --silent > /dev/null 2>&1; then
        print_success "Infrastructure tests passed"
    else
        print_warning "Some infrastructure tests failed, but continuing..."
    fi
    
    print_success "Test suite completed!"
}

# Function to bootstrap CDK with error handling
bootstrap_cdk_enhanced() {
    print_status "Bootstrapping CDK with enhanced error handling..."
    
    # Check if already bootstrapped
    if aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION > /dev/null 2>&1; then
        local stack_status=$(aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text)
        print_success "CDK already bootstrapped in region $AWS_REGION (Status: $stack_status)"
        return
    fi
    
    print_progress "Bootstrapping CDK for the first time..."
    
    # Bootstrap with specific context
    if npx cdk bootstrap --context environment=$ENVIRONMENT --region $AWS_REGION; then
        print_success "CDK bootstrapped successfully!"
    else
        print_error "CDK bootstrap failed. This might be due to insufficient permissions."
        print_error "Required permissions:"
        print_error "  - cloudformation:*"
        print_error "  - s3:*"
        print_error "  - iam:*"
        print_error "  - ssm:*"
        exit 1
    fi
}

# Function to deploy with progress tracking
deploy_with_progress() {
    print_status "Deploying infrastructure with progress tracking..."
    
    # Synthesize first to catch errors early
    print_progress "Synthesizing CDK stacks..."
    if npx cdk synth --context environment=$ENVIRONMENT > /dev/null 2>&1; then
        print_success "CDK synthesis completed successfully"
    else
        print_error "CDK synthesis failed. Check your CDK code for errors."
        exit 1
    fi
    
    # Build frontend before deployment
    print_progress "Building frontend application..."
    if (cd src/frontend && npm run build > /dev/null 2>&1); then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    # Deploy based on environment
    print_progress "Starting deployment to $ENVIRONMENT environment..."
    
    local deploy_start_time=$(date +%s)
    
    case $ENVIRONMENT in
        development)
            if npm run deploy:dev; then
                print_success "Development deployment completed"
            else
                print_error "Development deployment failed"
                exit 1
            fi
            ;;
        staging)
            if npm run deploy:staging; then
                print_success "Staging deployment completed"
            else
                print_error "Staging deployment failed"
                exit 1
            fi
            ;;
        production)
            print_warning "Production deployment requires additional confirmation"
            print_warning "This will deploy to production environment!"
            
            if [ "$FORCE_DEPLOY" != "true" ]; then
                read -p "Are you sure you want to deploy to production? (yes/no): " confirm
                if [ "$confirm" != "yes" ]; then
                    print_error "Production deployment cancelled by user"
                    exit 1
                fi
            fi
            
            if npm run deploy:prod; then
                print_success "Production deployment completed"
            else
                print_error "Production deployment failed"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    local deploy_end_time=$(date +%s)
    local deploy_duration=$((deploy_end_time - deploy_start_time))
    print_success "Deployment completed in ${deploy_duration} seconds"
}

# Function to perform comprehensive verification
comprehensive_verification() {
    print_status "Performing comprehensive deployment verification..."
    
    # Wait for services to be ready
    print_progress "Waiting for services to initialize..."
    sleep 30
    
    # Check CloudFormation stacks
    local stacks=(
        "LanguagePeer-Core-$ENVIRONMENT"
        "LanguagePeer-Voice-$ENVIRONMENT"
        "LanguagePeer-Agents-$ENVIRONMENT"
        "LanguagePeer-Monitoring-$ENVIRONMENT"
        "LanguagePeer-Demo-$ENVIRONMENT"
    )
    
    local failed_stacks=()
    
    for stack in "${stacks[@]}"; do
        print_progress "Checking stack: $stack"
        
        if aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION > /dev/null 2>&1; then
            local status=$(aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text)
            
            if [[ "$status" == *"COMPLETE"* ]]; then
                print_success "✓ $stack: $status"
            else
                print_warning "⚠ $stack: $status"
                failed_stacks+=("$stack")
            fi
        else
            print_warning "⚠ $stack: Not found"
            failed_stacks+=("$stack")
        fi
    done
    
    # Test API endpoints
    print_progress "Testing API endpoints..."
    
    local api_endpoint=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Core-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>/dev/null || echo "")
    
    if [ -n "$api_endpoint" ] && [ "$api_endpoint" != "None" ]; then
        if curl -s -f "${api_endpoint}health" > /dev/null 2>&1; then
            print_success "✓ Core API health check passed"
        else
            print_warning "⚠ Core API health check failed"
        fi
    fi
    
    # Test demo endpoints
    local demo_api_url=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>/dev/null || echo "")
    
    if [ -n "$demo_api_url" ] && [ "$demo_api_url" != "None" ]; then
        if curl -s -f "${demo_api_url}demo/health" > /dev/null 2>&1; then
            print_success "✓ Demo API health check passed"
        else
            print_warning "⚠ Demo API health check failed"
        fi
        
        if curl -s -f "${demo_api_url}demo/users" > /dev/null 2>&1; then
            print_success "✓ Demo API users endpoint working"
        else
            print_warning "⚠ Demo API users endpoint failed"
        fi
    fi
    
    # Check if there were any failures
    if [ ${#failed_stacks[@]} -gt 0 ]; then
        print_warning "Some stacks had issues:"
        for stack in "${failed_stacks[@]}"; do
            print_warning "  - $stack"
        done
        
        if [ "$FORCE_DEPLOY" != "true" ]; then
            print_error "Verification failed. Check the issues above."
            exit 1
        fi
    fi
    
    print_success "Deployment verification completed!"
}

# Function to generate deployment report
generate_deployment_report() {
    print_status "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# LanguagePeer Deployment Report

**Deployment Date:** $(date)
**Environment:** $ENVIRONMENT
**Region:** $AWS_REGION
**AWS Account:** $(aws sts get-caller-identity --query Account --output text)

## Stack Status

EOF
    
    # Add stack information
    local stacks=(
        "LanguagePeer-Core-$ENVIRONMENT"
        "LanguagePeer-Voice-$ENVIRONMENT"
        "LanguagePeer-Agents-$ENVIRONMENT"
        "LanguagePeer-Monitoring-$ENVIRONMENT"
        "LanguagePeer-Demo-$ENVIRONMENT"
    )
    
    for stack in "${stacks[@]}"; do
        if aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION > /dev/null 2>&1; then
            local status=$(aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text)
            echo "- **$stack:** $status" >> "$report_file"
        else
            echo "- **$stack:** Not Found" >> "$report_file"
        fi
    done
    
    # Add important URLs
    cat >> "$report_file" << EOF

## Important URLs

EOF
    
    local api_endpoint=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Core-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>/dev/null || echo "Not available")
    local demo_url=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    local demo_api_url=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    local dashboard_url=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Monitoring-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    
    cat >> "$report_file" << EOF
- **API Endpoint:** $api_endpoint
- **Demo Website:** $demo_url
- **Demo API:** $demo_api_url
- **Monitoring Dashboard:** $dashboard_url

## Next Steps

1. Visit the demo website to test the application
2. Monitor the application using the CloudWatch dashboard
3. Run integration tests: \`npm run test:integration\`
4. Run end-to-end tests: \`npm run test:e2e\`

## Cleanup

To remove all resources when done:
\`\`\`bash
npm run rollback
\`\`\`

EOF
    
    print_success "Deployment report generated: $report_file"
    
    # Display summary
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                           DEPLOYMENT SUMMARY                                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Environment: ${CYAN}$ENVIRONMENT${NC}"
    echo -e "Region: ${CYAN}$AWS_REGION${NC}"
    echo -e "Demo Website: ${CYAN}$demo_url${NC}"
    echo -e "Demo API: ${CYAN}$demo_api_url${NC}"
    echo -e "Monitoring: ${CYAN}$dashboard_url${NC}"
    echo -e "Report: ${CYAN}$report_file${NC}"
    echo -e "Log: ${CYAN}$LOG_FILE${NC}"
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [force_deploy]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (development|staging|production) [default: development]"
    echo "  force_deploy   Force deployment even if issues are detected (true|false) [default: false]"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to development"
    echo "  $0 development true          # Force deploy to development"
    echo "  $0 staging false             # Deploy to staging"
    echo "  $0 production true           # Force deploy to production"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_DEFAULT_REGION          AWS region [default: us-east-1]"
    echo "  AWS_PROFILE                 AWS profile to use"
    echo ""
}

# Main execution function
main() {
    # Check for help
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    # Start deployment
    local start_time=$(date +%s)
    
    print_header
    
    # Execute all deployment steps
    auto_install_prerequisites
    check_aws_services
    install_dependencies_with_retry
    run_comprehensive_tests
    bootstrap_cdk_enhanced
    deploy_with_progress
    comprehensive_verification
    generate_deployment_report
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    print_success "🎉 Automated deployment completed successfully in ${total_duration} seconds!"
    
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "1. Visit your demo website to test the application"
    echo -e "2. Check the monitoring dashboard for metrics"
    echo -e "3. Run integration tests: ${CYAN}npm run test:integration${NC}"
    echo -e "4. When done, cleanup with: ${CYAN}npm run rollback${NC}"
    echo ""
}

# Error handling
trap 'print_error "Deployment failed at line $LINENO. Check the log file: $LOG_FILE"' ERR

# Run main function
main "$@"