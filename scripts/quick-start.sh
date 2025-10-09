#!/bin/bash

# LanguagePeer Quick Start Script
# This script helps you get LanguagePeer up and running quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
SKIP_TESTS=${2:-false}
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo -e "${BLUE}🚀 LanguagePeer Quick Start${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Region: ${GREEN}$AWS_REGION${NC}"
echo -e "Skip Tests: ${GREEN}$SKIP_TESTS${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI and configure it."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        print_warning "AWS CDK is not installed. Installing globally..."
        npm install -g aws-cdk
    fi
    
    print_success "All prerequisites are satisfied!"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm ci
    
    # Install frontend dependencies
    cd src/frontend && npm ci && cd ../..
    
    print_success "Dependencies installed successfully!"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_status "Running tests..."
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test:unit -- --run
    
    # Run infrastructure tests
    print_status "Running infrastructure tests..."
    npm run test:infrastructure -- --run
    
    # Lint check
    print_status "Running linter..."
    npm run lint
    
    print_success "All tests passed!"
}

# Function to bootstrap CDK
bootstrap_cdk() {
    print_status "Bootstrapping CDK..."
    
    # Check if already bootstrapped
    if aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION > /dev/null 2>&1; then
        print_warning "CDK already bootstrapped in region $AWS_REGION"
    else
        npx cdk bootstrap --context environment=$ENVIRONMENT
        print_success "CDK bootstrapped successfully!"
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure to $ENVIRONMENT environment..."
    
    # Synthesize CDK to check for errors
    print_status "Synthesizing CDK stacks..."
    npm run cdk:synth -- --context environment=$ENVIRONMENT
    
    # Deploy stacks
    print_status "Deploying stacks..."
    case $ENVIRONMENT in
        development)
            npm run deploy:dev
            ;;
        staging)
            npm run deploy:staging
            ;;
        production)
            npm run deploy:prod
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    print_success "Infrastructure deployed successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if stacks exist
    STACKS=(
        "LanguagePeer-Core-$ENVIRONMENT"
        "LanguagePeer-Voice-$ENVIRONMENT"
        "LanguagePeer-Agents-$ENVIRONMENT"
        "LanguagePeer-Monitoring-$ENVIRONMENT"
        "LanguagePeer-Demo-$ENVIRONMENT"
    )
    
    for stack in "${STACKS[@]}"; do
        if aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION > /dev/null 2>&1; then
            STATUS=$(aws cloudformation describe-stacks --stack-name "$stack" --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text)
            if [[ "$STATUS" == *"COMPLETE"* ]]; then
                print_success "✓ $stack: $STATUS"
            else
                print_warning "⚠ $stack: $STATUS"
            fi
        else
            print_warning "⚠ $stack: Not found (may be optional)"
        fi
    done
    
    # Get important outputs
    print_status "Getting deployment outputs..."
    
    # API Endpoint
    API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Core-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>/dev/null || echo "Not available")
    
    # Demo Website URL
    DEMO_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    
    # Demo API URL
    DEMO_API_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    
    # Dashboard URL
    DASHBOARD_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Monitoring-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text 2>/dev/null || echo "Not available")
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo -e "${GREEN}===================${NC}"
    echo -e "Environment: ${BLUE}$ENVIRONMENT${NC}"
    echo -e "Region: ${BLUE}$AWS_REGION${NC}"
    echo -e "API Endpoint: ${BLUE}$API_ENDPOINT${NC}"
    echo -e "Demo Website: ${BLUE}$DEMO_URL${NC}"
    echo -e "Demo API: ${BLUE}$DEMO_API_URL${NC}"
    echo -e "Monitoring Dashboard: ${BLUE}$DASHBOARD_URL${NC}"
    echo ""
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test demo API health endpoint
    DEMO_API_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>/dev/null)
    
    if [ "$DEMO_API_URL" != "Not available" ] && [ "$DEMO_API_URL" != "" ]; then
        print_status "Testing demo API health endpoint..."
        if curl -s -f "${DEMO_API_URL}demo/health" > /dev/null; then
            print_success "✓ Demo API is responding"
        else
            print_warning "⚠ Demo API health check failed"
        fi
        
        print_status "Testing demo API users endpoint..."
        if curl -s -f "${DEMO_API_URL}demo/users" > /dev/null; then
            print_success "✓ Demo API users endpoint is working"
        else
            print_warning "⚠ Demo API users endpoint failed"
        fi
    else
        print_warning "Demo API URL not available, skipping API tests"
    fi
    
    # Test demo website
    DEMO_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>/dev/null)
    
    if [ "$DEMO_URL" != "Not available" ] && [ "$DEMO_URL" != "" ]; then
        print_status "Testing demo website..."
        if curl -s -f "$DEMO_URL" > /dev/null; then
            print_success "✓ Demo website is accessible"
        else
            print_warning "⚠ Demo website accessibility check failed"
        fi
    else
        print_warning "Demo website URL not available, skipping website test"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎯 Next Steps${NC}"
    echo -e "${GREEN}============${NC}"
    echo ""
    echo -e "1. ${BLUE}Visit the demo website:${NC}"
    DEMO_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoWebsiteUrl`].OutputValue' --output text 2>/dev/null || echo "Check CloudFormation outputs")
    echo -e "   $DEMO_URL"
    echo ""
    echo -e "2. ${BLUE}Monitor your application:${NC}"
    DASHBOARD_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Monitoring-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text 2>/dev/null || echo "Check CloudFormation outputs")
    echo -e "   $DASHBOARD_URL"
    echo ""
    echo -e "3. ${BLUE}Run integration tests:${NC}"
    echo -e "   export TEST_ENVIRONMENT=$ENVIRONMENT"
    echo -e "   npm run test:integration"
    echo ""
    echo -e "4. ${BLUE}Run end-to-end tests:${NC}"
    echo -e "   export DEMO_BASE_URL=\"$DEMO_URL\""
    DEMO_API_URL=$(aws cloudformation describe-stacks --stack-name "LanguagePeer-Demo-$ENVIRONMENT" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`DemoApiUrl`].OutputValue' --output text 2>/dev/null || echo "Check CloudFormation outputs")
    echo -e "   export DEMO_API_URL=\"$DEMO_API_URL\""
    echo -e "   npm run test:e2e"
    echo ""
    echo -e "5. ${BLUE}View logs and metrics:${NC}"
    echo -e "   aws logs describe-log-groups --log-group-name-prefix \"/aws/languagepeer\""
    echo -e "   aws cloudwatch list-dashboards"
    echo ""
    echo -e "6. ${BLUE}Clean up (when done):${NC}"
    echo -e "   npm run rollback"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo -e "   - Deployment Guide: docs/deployment-guide.md"
    echo -e "   - Testing Guide: docs/testing-guide.md"
    echo -e "   - Architecture: docs/architecture-diagram.md"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}Starting LanguagePeer deployment...${NC}"
    echo ""
    
    # Check if help is requested
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [environment] [skip_tests]"
        echo ""
        echo "Arguments:"
        echo "  environment    Target environment (development|staging|production) [default: development]"
        echo "  skip_tests     Skip running tests (true|false) [default: false]"
        echo ""
        echo "Examples:"
        echo "  $0                           # Deploy to development, run tests"
        echo "  $0 development true          # Deploy to development, skip tests"
        echo "  $0 staging false             # Deploy to staging, run tests"
        echo ""
        echo "Environment Variables:"
        echo "  AWS_DEFAULT_REGION          AWS region [default: us-east-1]"
        echo "  AWS_PROFILE                 AWS profile to use"
        echo ""
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    install_dependencies
    run_tests
    bootstrap_cdk
    deploy_infrastructure
    verify_deployment
    test_deployment
    show_next_steps
    
    print_success "🎉 LanguagePeer deployment completed successfully!"
}

# Run main function
main "$@"