#!/bin/bash

# LanguagePeer Deployment Script
# Usage: ./scripts/deploy.sh [environment] [stack]
# Example: ./scripts/deploy.sh development all
# Example: ./scripts/deploy.sh production core

set -e

ENVIRONMENT=${1:-development}
STACK=${2:-all}
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "🚀 Deploying LanguagePeer to environment: $ENVIRONMENT"
echo "📍 Region: $REGION"
echo "📦 Stack: $STACK"

# Validate environment
case $ENVIRONMENT in
  development|staging|production)
    echo "✅ Valid environment: $ENVIRONMENT"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS credentials not configured"
  echo "Please run 'aws configure' or set AWS environment variables"
  exit 1
fi

echo "✅ AWS credentials configured"

# Bootstrap CDK if needed
echo "🔧 Bootstrapping CDK..."
npx cdk bootstrap --context environment=$ENVIRONMENT

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd src/frontend && npm ci && cd ../..

# Run tests
if [ "$ENVIRONMENT" != "development" ]; then
  echo "🧪 Running tests..."
  npm run test:unit -- --run
  npm run test:integration -- --run
fi

# Build frontend
echo "🏗️ Building frontend..."
cd src/frontend && npm run build && cd ../..

# Deploy stacks
case $STACK in
  all)
    echo "🚀 Deploying all stacks..."
    npx cdk deploy --all --require-approval never --context environment=$ENVIRONMENT
    ;;
  core)
    echo "🚀 Deploying core stack..."
    npx cdk deploy LanguagePeer-Core-$ENVIRONMENT --require-approval never --context environment=$ENVIRONMENT
    ;;
  voice)
    echo "🚀 Deploying voice processing stack..."
    npx cdk deploy LanguagePeer-Voice-$ENVIRONMENT --require-approval never --context environment=$ENVIRONMENT
    ;;
  agents)
    echo "🚀 Deploying agents stack..."
    npx cdk deploy LanguagePeer-Agents-$ENVIRONMENT --require-approval never --context environment=$ENVIRONMENT
    ;;
  monitoring)
    echo "🚀 Deploying monitoring stack..."
    npx cdk deploy LanguagePeer-Monitoring-$ENVIRONMENT --require-approval never --context environment=$ENVIRONMENT
    ;;
  pipeline)
    echo "🚀 Deploying pipeline stack..."
    npx cdk deploy LanguagePeer-Pipeline-$ENVIRONMENT --require-approval never --context environment=$ENVIRONMENT
    ;;
  *)
    echo "❌ Invalid stack: $STACK"
    echo "Valid stacks: all, core, voice, agents, monitoring, pipeline"
    exit 1
    ;;
esac

echo "✅ Deployment completed successfully!"

# Display stack outputs
echo "📋 Stack outputs:"
npx cdk list --context environment=$ENVIRONMENT | while read stack_name; do
  if [[ $stack_name == *"$ENVIRONMENT"* ]]; then
    echo "Stack: $stack_name"
    aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" \
      --query 'Stacks[0].Outputs[?OutputKey && OutputValue].{Key:OutputKey,Value:OutputValue}' \
      --output table 2>/dev/null || echo "No outputs available"
    echo ""
  fi
done

echo "🎉 LanguagePeer deployment to $ENVIRONMENT completed!"