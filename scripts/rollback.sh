#!/bin/bash

# LanguagePeer Rollback Script
# Usage: ./scripts/rollback.sh [environment] [stack]
# Example: ./scripts/rollback.sh production all

set -e

ENVIRONMENT=${1:-development}
STACK=${2:-all}
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "🔄 Rolling back LanguagePeer in environment: $ENVIRONMENT"
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
  exit 1
fi

echo "✅ AWS credentials configured"

# Function to rollback a single stack
rollback_stack() {
  local stack_name=$1
  echo "🔄 Rolling back stack: $stack_name"
  
  # Check if stack exists
  if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" > /dev/null 2>&1; then
    # Get the previous successful deployment
    local change_sets=$(aws cloudformation list-change-sets --stack-name "$stack_name" --region "$REGION" --query 'Summaries[?Status==`COMPLETE`].ChangeSetName' --output text)
    
    if [ -n "$change_sets" ]; then
      echo "📋 Available change sets for rollback:"
      echo "$change_sets"
      
      # For safety, we'll just show what would be rolled back
      echo "⚠️  Manual rollback required through AWS Console"
      echo "🔗 https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks/stackinfo?stackId=$stack_name"
    else
      echo "⚠️  No change sets available for rollback"
    fi
  else
    echo "❌ Stack $stack_name not found"
  fi
}

# Function to destroy a stack (for development environment)
destroy_stack() {
  local stack_name=$1
  echo "🗑️ Destroying stack: $stack_name"
  
  if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" > /dev/null 2>&1; then
    npx cdk destroy "$stack_name" --force --context environment=$ENVIRONMENT
    echo "✅ Stack $stack_name destroyed"
  else
    echo "❌ Stack $stack_name not found"
  fi
}

# Rollback or destroy based on environment and stack
if [ "$ENVIRONMENT" = "development" ]; then
  echo "🗑️ Development environment - offering stack destruction"
  read -p "Do you want to destroy stacks instead of rollback? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    case $STACK in
      all)
        destroy_stack "LanguagePeer-Monitoring-$ENVIRONMENT"
        destroy_stack "LanguagePeer-Agents-$ENVIRONMENT"
        destroy_stack "LanguagePeer-Voice-$ENVIRONMENT"
        destroy_stack "LanguagePeer-Core-$ENVIRONMENT"
        destroy_stack "LanguagePeer-Pipeline-$ENVIRONMENT"
        ;;
      core)
        destroy_stack "LanguagePeer-Core-$ENVIRONMENT"
        ;;
      voice)
        destroy_stack "LanguagePeer-Voice-$ENVIRONMENT"
        ;;
      agents)
        destroy_stack "LanguagePeer-Agents-$ENVIRONMENT"
        ;;
      monitoring)
        destroy_stack "LanguagePeer-Monitoring-$ENVIRONMENT"
        ;;
      pipeline)
        destroy_stack "LanguagePeer-Pipeline-$ENVIRONMENT"
        ;;
    esac
    exit 0
  fi
fi

# Standard rollback process
case $STACK in
  all)
    rollback_stack "LanguagePeer-Monitoring-$ENVIRONMENT"
    rollback_stack "LanguagePeer-Agents-$ENVIRONMENT"
    rollback_stack "LanguagePeer-Voice-$ENVIRONMENT"
    rollback_stack "LanguagePeer-Core-$ENVIRONMENT"
    rollback_stack "LanguagePeer-Pipeline-$ENVIRONMENT"
    ;;
  core)
    rollback_stack "LanguagePeer-Core-$ENVIRONMENT"
    ;;
  voice)
    rollback_stack "LanguagePeer-Voice-$ENVIRONMENT"
    ;;
  agents)
    rollback_stack "LanguagePeer-Agents-$ENVIRONMENT"
    ;;
  monitoring)
    rollback_stack "LanguagePeer-Monitoring-$ENVIRONMENT"
    ;;
  pipeline)
    rollback_stack "LanguagePeer-Pipeline-$ENVIRONMENT"
    ;;
  *)
    echo "❌ Invalid stack: $STACK"
    echo "Valid stacks: all, core, voice, agents, monitoring, pipeline"
    exit 1
    ;;
esac

echo "🔄 Rollback process completed!"
echo "⚠️  Please verify the rollback through AWS Console"