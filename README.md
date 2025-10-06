# LanguagePeer 🗣️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/username/language-peer/ci.yml?branch=main)](https://github.com/username/language-peer/actions)
[![AWS](https://img.shields.io/badge/AWS-Bedrock%20%7C%20Lambda%20%7C%20Transcribe-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Strands](https://img.shields.io/badge/Strands-AI%20Agents-purple)](https://github.com/strands-ai/strands)
[![Last Updated](https://img.shields.io/github/last-commit/username/language-peer)](https://github.com/username/language-peer)
[![Issues](https://img.shields.io/github/issues/username/language-peer)](https://github.com/username/language-peer/issues)
[![Stars](https://img.shields.io/github/stars/username/language-peer)](https://github.com/username/language-peer/stargazers)
[![Code Coverage](https://img.shields.io/codecov/c/github/username/language-peer)](https://codecov.io/gh/username/language-peer)

> A voice-first GenAI application that helps language learners build fluency through natural conversations with autonomous AI agents powered by AWS Bedrock and Strands.

## 🎯 Overview

LanguagePeer addresses the common challenges language learners face: finding consistent speaking partners, overcoming speaking anxiety, and receiving meaningful feedback. By providing a safe, judgment-free environment for voice-based practice with intelligent AI agents, LanguagePeer empowers users to improve their speaking abilities through personalized conversations and actionable feedback.

## ✨ Key Features

- 🤖 **Autonomous AI Agents**: Multiple personalities powered by AWS Bedrock (Claude, Llama, Nova)
- 🎙️ **Real-time Voice Processing**: Amazon Transcribe & Polly for seamless speech interactions
- 📊 **Intelligent Feedback**: Grammar, fluency, and vocabulary analysis with Amazon Comprehend
- 📈 **Progress Tracking**: Personalized learning paths with Kinesis Analytics
- 🎭 **Modular Personalities**: Strands-powered agents with distinct teaching styles
- 🔄 **Adaptive Learning**: Autonomous difficulty adjustment based on user performance

## 🏗️ Architecture

![Architecture Diagram](docs/architecture-diagram.png)

LanguagePeer leverages AWS's comprehensive AI/ML services in a serverless, scalable architecture:

- **AWS Bedrock + Strands**: Multi-agent orchestration with autonomous reasoning
- **Amazon Transcribe**: Real-time speech-to-text processing
- **Amazon Polly**: Natural speech synthesis with SSML support
- **Amazon Comprehend**: Language analysis and entity detection
- **AWS Lambda**: Serverless compute for agent logic
- **Amazon DynamoDB**: Conversation state and progress storage
- **Amazon Kinesis**: Real-time analytics and event streaming

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK v2 installed globally

### Installation

```bash
# Clone the repository
git clone https://github.com/username/language-peer.git
cd language-peer

# Install dependencies
npm install

# Deploy AWS infrastructure
npm run deploy

# Start the development server
npm run dev
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Configure your AWS credentials and region
AWS_REGION=us-east-1
AWS_PROFILE=your-profile
```

## 🎮 Demo

Experience LanguagePeer in action:

- **Live Demo**: [https://language-peer.demo.aws](https://language-peer.demo.aws)
- **Demo Video**: [3-minute walkthrough](docs/demo-video.md)
- **Test Credentials**: Available in [deployment guide](docs/deployment-guide.md)

## 📚 Documentation

- [Requirements Specification](docs/requirements.md)
- [Architecture & Design](docs/design.md)
- [Implementation Tasks](docs/tasks.md)
- [Deployment Guide](docs/deployment-guide.md)
- [API Documentation](docs/api.md)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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