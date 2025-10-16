# LanguagePeer 🗣️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/asharanees/language-peer/ci.yml?branch=main)](https://github.com/asharanees/language-peer/actions)
[![AWS GenAI Hackathon](https://img.shields.io/badge/AWS-GenAI%20Hackathon%202025-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![AWS Services](https://img.shields.io/badge/AWS-Bedrock%20%7C%20Transcribe%20%7C%20Polly-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Strands AI](https://img.shields.io/badge/Strands-Modular%20Agents-8A2BE2)](https://github.com/strands-ai/strands)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Last Commit](https://img.shields.io/github/last-commit/asharanees/language-peer?color=blue)](https://github.com/asharanees/language-peer)
[![Issues](https://img.shields.io/github/issues/asharanees/language-peer?color=red)](https://github.com/asharanees/language-peer/issues)
[![Stars](https://img.shields.io/github/stars/asharanees/language-peer?color=gold)](https://github.com/asharanees/language-peer/stargazers)
[![Forks](https://img.shields.io/github/forks/asharanees/language-peer?color=blue)](https://github.com/asharanees/language-peer/network/members)

> A voice-first GenAI application that helps language learners build fluency through natural conversations with autonomous AI agents powered by AWS Bedrock and Strands.

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Demo](#-demo)
- [Documentation](#-documentation)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [AWS GenAI Hackathon](#-aws-genai-hackathon)

## 🎯 Overview

LanguagePeer addresses the common challenges language learners face: finding consistent speaking partners, overcoming speaking anxiety, and receiving meaningful feedback. By providing a safe, judgment-free environment for voice-based practice with intelligent AI agents, LanguagePeer empowers users to improve their speaking abilities through personalized conversations and actionable feedback.

## ✨ Key Features

- 🤖 **Autonomous AI Agents**: Multiple personalities powered by AWS Bedrock (Claude, Llama, Nova)
- 🎙️ **Real-time Voice Processing**: Amazon Transcribe & Polly for seamless speech interactions
- 🔊 **Intelligent Text-to-Speech**: Browser-based TTS with agent-specific voice personalities and controls
- 📊 **Intelligent Feedback**: Grammar, fluency, and vocabulary analysis with Amazon Comprehend
- 📈 **Progress Tracking**: Personalized learning paths with Kinesis Analytics
- 🎭 **Modular Personalities**: Strands-powered agents with distinct teaching styles and voice characteristics
- 🔄 **Adaptive Learning**: Autonomous difficulty adjustment based on user performance
- 💬 **Enhanced Offline-First Design**: Intelligent offline mode with contextual AI responses and realistic feedback
- 🔄 **Seamless Mode Switching**: Automatic text mode when voice recording isn't available
- 🧠 **Smart Mock Responses**: Context-aware agent personalities that adapt to conversation topics
- 📊 **Realistic Offline Feedback**: Dynamic scoring and personalized suggestions without API dependency
- 🎚️ **Voice Control Features**: Stop speaking functionality and agent-specific speech synthesis
- 🔐 **User Authentication**: Secure login/signup with personalized learning profiles and progress tracking

## 🏗️ Architecture

![Architecture Diagram](docs/architecture-diagram.png)

> **Note**: Architecture diagram PNG is being generated from [Mermaid source](docs/architecture-diagram.md)

LanguagePeer leverages AWS's comprehensive AI/ML services in a serverless, scalable architecture:

- **AWS Bedrock + Strands**: Multi-agent orchestration with autonomous reasoning
- **Amazon Transcribe**: Real-time speech-to-text processing
- **Amazon Polly**: Natural speech synthesis with SSML support
- **Amazon Comprehend**: Language analysis and entity detection
- **AWS Lambda**: Serverless compute for agent logic
- **Amazon DynamoDB**: Conversation state and progress storage
- **Amazon Kinesis**: Real-time analytics and event streaming

## 🚀 Quick Start

### One-Click Setup & Deployment (Recommended)

The fastest way to get LanguagePeer running:

```bash
# Clone the repository
git clone https://github.com/asharanees/language-peer.git
cd language-peer

# Step 1: Configure your settings (interactive)
./scripts/setup-config.sh

# Step 2: Deploy everything automatically
./scripts/auto-deploy.sh
```

**What happens during setup:**
- 🔧 **Interactive Configuration**: Prompts for GitHub, AWS, and domain settings
- ✅ **Validation**: Checks repository access and AWS credentials
- 📝 **File Updates**: Replaces all placeholders with your actual values
- 🎯 **Ready to Deploy**: Creates `.env` and configuration summary

**What happens during deployment:**
- ✅ Install Node.js, AWS CLI, and CDK if missing
- ✅ Verify AWS credentials and service access
- ✅ Install all dependencies with retry logic
- ✅ Run comprehensive tests
- ✅ Deploy infrastructure to AWS
- ✅ Verify deployment and generate report

### Manual Installation (Advanced Users)

If you prefer manual control:

```bash
# Prerequisites: Node.js 18+, AWS CLI, CDK v2
npm install -g aws-cdk

# Clone and install
git clone https://github.com/asharanees/language-peer.git
cd language-peer
npm install

# Configure AWS
aws configure

# Manual configuration (or use setup script)
cp .env.example .env
# Edit .env with your settings

# Deploy infrastructure
npm run deploy

# Start development server
npm run dev
```

### Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **AWS CLI** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK v2** - Installed automatically by setup script
- **Git** - For repository management
- **AWS Account** - With appropriate permissions for Bedrock, Lambda, DynamoDB, etc.
- **HTTPS Environment** - Required for voice recording (automatic fallback to text mode on HTTP)
- **User Account** - Create an account through the authentication modal to access personalized features

### AWS Service Requirements

Ensure your AWS account has access to:
- ✅ **AWS Bedrock** - Foundation models (Claude, Llama, Nova)
- ✅ **Amazon Transcribe** - Real-time speech-to-text
- ✅ **Amazon Polly** - Neural text-to-speech
- ✅ **Amazon Comprehend** - Language analysis
- ✅ **AWS Lambda** - Serverless compute
- ✅ **Amazon DynamoDB** - NoSQL database
- ✅ **Amazon Kinesis** - Real-time analytics
- ✅ **Amazon S3** - Object storage
- ✅ **AWS API Gateway** - REST API management

### Environment Setup Options

**Option 1: Automated Setup (Recommended)**
```bash
# Interactive configuration with validation
./scripts/setup-config.sh

# What this does:
# ✅ Validates AWS credentials and service access
# ✅ Checks repository permissions
# ✅ Configures all environment variables
# ✅ Updates configuration files
# ✅ Prepares for deployment
```

**Option 2: Manual Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings:
AWS_DEFAULT_REGION=us-east-1
GITHUB_OWNER=your-github-username
GITHUB_REPO=language-peer
PROD_DOMAIN=yourdomain.com  # Optional
STAGING_DOMAIN=staging.yourdomain.com  # Optional

# Configure AWS credentials
aws configure
```

**Option 3: Quick Development Setup**
```bash
# For development/testing only
npm run setup:dev

# Uses default settings for rapid prototyping
# Not recommended for production deployment
```

### Deployment Options

```bash
# Automated deployment to different environments
./scripts/auto-deploy.sh development    # Deploy to dev (default)
./scripts/auto-deploy.sh staging        # Deploy to staging
./scripts/auto-deploy.sh production     # Deploy to production

# Force deployment (skip verification checks)
./scripts/auto-deploy.sh production true

# Manual deployment commands
npm run deploy:dev      # Development environment
npm run deploy:staging  # Staging environment
npm run deploy:prod     # Production environment
```

## 🎮 Demo

Experience LanguagePeer in action:

- **Demo Video**: [3-minute walkthrough](docs/demo-video.md) showcasing voice interactions
- **Live Demo**: Deploy your own instance following the [deployment guide](docs/deployment-guide.md)
- **Screenshots**: See the voice-first interface in the [docs folder](docs/)

### Key Demo Features
- 🎙️ Real-time voice conversation with AI agents (when supported)
- 📊 Live feedback on grammar and pronunciation
- 🤖 Agent personality switching based on learning needs
- 📈 Progress tracking and analytics dashboard
- 💬 Offline-first design with automatic text mode fallback
- 🔄 Works without backend API - local session management and mock responses
- 🔐 User authentication with personalized learning profiles and language preferences

### Screenshots

| Feature | Preview |
|---------|---------|
| 🎙️ **Voice Interface** | ![Voice Interface](docs/screenshots/voice-interface.png) |
| 🤖 **Agent Selection** | ![Agent Selection](docs/screenshots/agent-selection.png) |
| 📊 **Progress Dashboard** | ![Progress Dashboard](docs/screenshots/progress-dashboard.png) |

> **Note**: Screenshots show the actual deployed interface. See our [deployment guide](docs/deployment-guide.md) to create your own instance.

### Frontend Assets

The application uses a minimal asset approach:
- **No favicon**: Simplified deployment without icon dependencies
- **Web App Manifest**: Basic PWA support via `manifest.json`
- **Font Loading**: Google Fonts (Inter) preloaded for optimal performance
- **Voice Permissions**: Microphone access configured via permissions policy

## 📚 Documentation

### Core Documentation
- 📋 [Requirements Specification](docs/requirements.md) - Complete functional and non-functional requirements
- 🏗️ [Architecture & Design](.kiro/specs/language-peer/design.md) - System architecture and technical design
- 📊 [Architecture Diagrams](docs/architecture-diagram.md) - Visual system architecture with Mermaid diagrams
- 🔄 [Offline-First Design](docs/offline-first-design.md) - Local session management and mock agent responses
- 📝 [Implementation Tasks](.kiro/specs/language-peer/tasks.md) - Detailed development task breakdown
- 🚀 [Deployment Guide](docs/deployment-guide.md) - Complete deployment instructions
- 🔌 [API Documentation](docs/api.md) - Comprehensive REST API reference
- 🔐 [Authentication Guide](docs/authentication-guide.md) - User authentication and profile management
- ♿ [Accessibility Features](docs/accessibility-features.md) - Comprehensive accessibility and fallback system

### Setup and Usage
- ⚡ [Quick Start Guide](#-quick-start) - Get running in minutes
- 🛠️ [Manual Setup Guide](docs/manual-inputs-guide.md) - Step-by-step manual configuration
- 🤖 [Automated Deployment](docs/automated-deployment.md) - One-click deployment process
- 🧪 [Testing Guide](docs/testing-guide.md) - Testing procedures and best practices
- 🎨 [Frontend Assets](docs/frontend-assets.md) - Asset management and configuration

### Demo and Examples
- 🎥 [Demo Video](docs/demo-video.md) - 3-minute walkthrough and production guide
- 📸 [Screenshots](docs/screenshots/) - Visual interface examples
- 🎬 [Demo Production Guide](docs/demo-production-guide.md) - Video creation instructions

## 🧪 Testing

### Test Suite Overview
LanguagePeer includes comprehensive testing at multiple levels:

```bash
# Run all tests
npm test

# Unit tests (components, services, utilities)
npm run test:unit

# Integration tests (AWS services, API endpoints)
npm run test:integration

# End-to-end tests (full user workflows)
npm run test:e2e

# Voice processing tests (Transcribe, Polly integration)
npm run test:voice

# Agent coordination tests (Bedrock, Strands framework)
npm run test:agents

# Performance tests (load testing, latency)
npm run test:performance
```

### Test Coverage
- **Unit Tests**: 95%+ coverage for core business logic
- **Integration Tests**: All AWS service integrations
- **E2E Tests**: Complete user conversation workflows
- **Voice Tests**: Real-time audio processing pipeline
- **Agent Tests**: Multi-agent coordination and handoffs

### Testing in Different Environments
```bash
# Test against development environment
npm run test:dev

# Test against staging environment
npm run test:staging

# Test production deployment (read-only)
npm run test:prod:readonly
```

### CloudFront API Testing Tool
An interactive HTML test tool is available for easy CloudFront distribution testing:

```bash
# Open the test tool in your browser
open test-cloudfront.html
```

**Features:**
- Interactive button to test POST requests to the conversation endpoint
- Real-time display of API responses and errors
- Pre-configured test payload with sample conversation data
- Direct testing through the CloudFront CDN distribution

**Test Payload:**
```json
{
  "message": "Hello test",
  "agentPersonality": "friendly-tutor", 
  "userId": "test-user"
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### AWS Service Access Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Test Transcribe service
aws transcribe list-vocabularies --region us-east-1
```

#### Deployment Problems
```bash
# Check CDK bootstrap status
cdk bootstrap aws://ACCOUNT-ID/REGION

# Verify all dependencies
npm run verify:dependencies

# Clean and reinstall
npm run clean && npm install

# Force redeploy
npm run deploy:force
```

#### Voice Processing Issues
- **Microphone Access**: Ensure HTTPS for WebRTC (automatic fallback to text mode on HTTP)
- **Audio Quality**: Check browser compatibility
- **Latency Issues**: Verify network connection (app works offline with mock responses)
- **Transcription Errors**: Test with clear audio samples
- **Voice Not Available**: System automatically provides text interface - no action needed
- **TTS Not Working**: Browser-based speech synthesis with automatic fallback to text-only mode
- **Speech Interruption**: Use "Stop Speaking" button to cancel ongoing TTS playback
- **TTS Timing Issues**: System uses event-driven completion detection for accurate speech timing
- **Voice Selection**: System automatically selects appropriate voices based on agent personality
- **API Unavailable**: App continues with enhanced offline mode featuring contextual AI responses and realistic feedback
- **Offline Mode**: Intelligent agent personalities provide natural conversations without backend dependency

#### Agent Response Problems
- **Slow Responses**: Check Bedrock service limits
- **Inconsistent Personalities**: Verify agent configuration
- **Context Loss**: Check DynamoDB connection
- **Handoff Failures**: Review agent coordination logs

### Getting Help

1. **Check Documentation**: Review relevant docs in `/docs` folder
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Run Diagnostics**: Use `npm run diagnose` for system health check
4. **Enable Debug Logging**: Set `DEBUG=languagepeer:*` environment variable
5. **Contact Support**: Create GitHub issue with detailed error information

### Debug Mode
```bash
# Enable comprehensive logging
DEBUG=languagepeer:* npm run dev

# AWS service debugging
AWS_SDK_LOAD_CONFIG=1 DEBUG=aws-sdk npm run dev

# Voice processing debugging
DEBUG=voice:* npm run dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run the test suite (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run tests
npm test

# Start development server
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 AWS GenAI Hackathon

LanguagePeer was built for the AWS GenAI Hackathon, demonstrating:

- ✅ **LLM Integration**: AWS Bedrock foundation models with dynamic routing
- ✅ **Required AWS Services**: Bedrock Agents, Transcribe, Polly, Comprehend, Lambda, DynamoDB
- ✅ **Autonomous AI Agents**: Strands-powered agents with independent reasoning and decision-making

## 🙏 Acknowledgments

- AWS Bedrock team for foundation model access
- Strands framework for modular agent architecture
- Open source community for inspiration and tools

---

**Built with ❤️ for language learners worldwide**
