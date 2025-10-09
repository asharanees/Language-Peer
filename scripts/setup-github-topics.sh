#!/bin/bash

# GitHub Repository Topics Setup Script
# Run this after creating your GitHub repository

echo "Setting up GitHub repository topics for LanguagePeer..."

# Replace 'username/language-peer' with your actual repository
REPO="your-github-username/language-peer"

# Primary topics (required for hackathon)
gh api repos/$REPO/topics -X PUT -f names='["genai","hackathon","voice-ui","modular-agents","aws","aws-bedrock","language-learning","ai-agents","strands","typescript","serverless","transcribe","polly","comprehend","dynamodb","lambda","voice-first","conversation-ai","language-practice","speech-recognition","text-to-speech","real-time-feedback","aws-cdk","react","nodejs","jest"]'

echo "✅ GitHub topics have been set!"
echo "📝 Don't forget to:"
echo "   1. Update the repository URL in package.json"
echo "   2. Update README.md badge URLs"
echo "   3. Configure GitHub Actions secrets for deployment"