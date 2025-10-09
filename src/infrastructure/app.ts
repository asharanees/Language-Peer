#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LanguagePeerStack } from './stacks/language-peer-stack';
import { VoiceProcessingStack } from './stacks/voice-processing-stack';
import { AgentStack } from './stacks/agent-stack';
import { DeploymentPipelineStack } from './stacks/deployment-pipeline-stack';
import { MonitoringStack } from './stacks/monitoring-stack';

const app = new cdk.App();

// Get environment configuration
const environment = app.node.tryGetContext('environment') || 'development';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const env = { account, region };

// Core infrastructure stack
const coreStack = new LanguagePeerStack(app, `LanguagePeer-Core-${environment}`, {
    env,
    environment,
    description: 'Core infrastructure for LanguagePeer voice-first language learning platform'
});

// Voice processing stack (Transcribe, Polly, S3)
const voiceStack = new VoiceProcessingStack(app, `LanguagePeer-Voice-${environment}`, {
    env,
    environment,
    description: 'Voice processing infrastructure with AWS Transcribe and Polly'
});

// AI Agent stack (Bedrock, Strands)
const agentStack = new AgentStack(app, `LanguagePeer-Agents-${environment}`, {
    env,
    environment,
    description: 'AI agent infrastructure with AWS Bedrock and Strands framework'
});

// Monitoring stack
new MonitoringStack(app, `LanguagePeer-Monitoring-${environment}`, {
    env,
    environment,
    userTableName: coreStack.userTable.tableName,
    sessionTableName: coreStack.sessionTable.tableName,
    apiGatewayId: coreStack.api.restApiId,
    audioBucketName: voiceStack.audioBucket.bucketName,
    description: `Monitoring and alerting infrastructure for LanguagePeer ${environment} environment`
});

// Deployment pipeline stack (only for staging and production)
if (environment !== 'development') {
    new DeploymentPipelineStack(app, `LanguagePeer-Pipeline-${environment}`, {
        env,
        environment,
        githubOwner: process.env.GITHUB_OWNER || 'your-github-username',
        githubRepo: process.env.GITHUB_REPO || 'language-peer',
        githubBranch: environment === 'production' ? 'main' : 'develop',
        description: `Deployment pipeline for LanguagePeer ${environment} environment`
    });
}