#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LanguagePeerStack } from './stacks/language-peer-stack';
import { VoiceProcessingStack } from './stacks/voice-processing-stack';
import { AgentStack } from './stacks/agent-stack';

const app = new cdk.App();

// Get environment configuration
const environment = app.node.tryGetContext('environment') || 'development';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const env = { account, region };

// Core infrastructure stack
new LanguagePeerStack(app, `LanguagePeer-Core-${environment}`, {
  env,
  environment,
  description: 'Core infrastructure for LanguagePeer voice-first language learning platform'
});

// Voice processing stack (Transcribe, Polly, S3)
new VoiceProcessingStack(app, `LanguagePeer-Voice-${environment}`, {
  env,
  environment,
  description: 'Voice processing infrastructure with AWS Transcribe and Polly'
});

// AI Agent stack (Bedrock, Strands)
new AgentStack(app, `LanguagePeer-Agents-${environment}`, {
  env,
  environment,
  description: 'AI agent infrastructure with AWS Bedrock and Strands framework'
});