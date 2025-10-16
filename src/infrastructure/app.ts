#!/usr/bin/env node
/**
 * LanguagePeer Infrastructure Application
 * 
 * This is the main CDK application entry point that orchestrates the deployment
 * of all infrastructure stacks for the LanguagePeer voice-first language learning platform.
 * 
 * The application deploys different stack combinations based on the target environment:
 * - Development: Core services only with minimal monitoring
 * - Staging: Full stack with CI/CD pipeline for testing
 * - Production: Full stack with enhanced monitoring and security
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LanguagePeerStack } from './stacks/language-peer-stack';
import { VoiceProcessingStack } from './stacks/voice-processing-stack';
import { AgentStack } from './stacks/agent-stack';
import { DeploymentPipelineStack } from './stacks/deployment-pipeline-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
// import { CloudFrontStack } from './stacks/cloudfront-stack';

// Initialize CDK application
const app = new cdk.App();

// Environment configuration constants
const DEFAULT_ENVIRONMENT = 'development';
const DEFAULT_REGION = 'us-east-1';

/**
 * Extract deployment configuration from CDK context and environment variables
 * 
 * Environment can be specified via CDK context: --context environment=production
 * AWS account and region are derived from AWS CLI configuration or environment variables
 */
const environment = app.node.tryGetContext('environment') || DEFAULT_ENVIRONMENT;
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || DEFAULT_REGION;

// Standard AWS environment configuration for all stacks
const env = { account, region };

/**
 * Deploy core infrastructure stack
 * 
 * Contains foundational services: DynamoDB tables, API Gateway, Lambda functions
 * This stack must be deployed first as other stacks depend on its resources
 */
const coreStack = new LanguagePeerStack(app, `LanguagePeer-Core-${environment}`, {
    env,
    environment,
    description: 'Core infrastructure for LanguagePeer voice-first language learning platform'
});

/**
 * Deploy voice processing stack
 * 
 * Handles audio storage, transcription, and text-to-speech services
 * Includes S3 bucket for audio files and IAM roles for AWS Transcribe/Polly access
 */
const voiceStack = new VoiceProcessingStack(app, `LanguagePeer-Voice-${environment}`, {
    env,
    environment,
    description: 'Voice processing infrastructure with AWS Transcribe and Polly'
});

/**
 * Deploy AI agent stack
 * 
 * Manages AI-powered language tutoring agents using AWS Bedrock
 * Includes Kinesis streams for real-time analytics and agent coordination
 */
new AgentStack(app, `LanguagePeer-Agents-${environment}`, {
    env,
    environment,
    description: 'AI agent infrastructure with AWS Bedrock and Strands framework'
});

/**
 * Deploy monitoring and observability stack
 * 
 * Provides comprehensive monitoring, logging, and alerting for all services
 * Includes CloudWatch dashboards, alarms, and X-Ray tracing configuration
 */
new MonitoringStack(app, `LanguagePeer-Monitoring-${environment}`, {
    env,
    environment,
    userTableName: coreStack.userTable.tableName,
    sessionTableName: coreStack.sessionTable.tableName,
    apiGatewayId: coreStack.api.restApiId,
    audioBucketName: voiceStack.audioBucket.bucketName,
    description: `Monitoring and alerting infrastructure for LanguagePeer ${environment} environment`
});

/**
 * Deploy CloudFront stack for CDN distribution and mobile optimization
 * 
 * Provides global content delivery network for reduced latency and mobile-optimized
 * caching strategies with SSL/TLS termination and security headers
 */
// new CloudFrontStack(app, `LanguagePeer-CloudFront-${environment}`, {
//     env,
//     apiGateway: coreStack.api,
//     frontendBucket: coreStack.frontendBucket,
//     description: `CloudFront distribution for mobile-optimized access to LanguagePeer ${environment}`
// });

// Environment-specific deployment configuration
const DEVELOPMENT_ENV = 'development';
const PRODUCTION_BRANCH = 'main';
const STAGING_BRANCH = 'develop';
const DEFAULT_GITHUB_OWNER = 'asharanees';
const DEFAULT_GITHUB_REPO = 'language-peer';

/**
 * Deploy CI/CD pipeline stack for non-development environments
 * 
 * Development environment uses manual deployments for faster iteration
 * Staging and production environments use automated pipelines for consistency and safety
 * 
 * Pipeline configuration:
 * - Production: Deploys from 'main' branch with additional approval gates
 * - Staging: Deploys from 'develop' branch for continuous integration testing
 */
if (environment !== DEVELOPMENT_ENV) {
    const githubBranch = environment === 'production' ? PRODUCTION_BRANCH : STAGING_BRANCH;
    
    new DeploymentPipelineStack(app, `LanguagePeer-Pipeline-${environment}`, {
        env,
        environment,
        githubOwner: process.env.GITHUB_OWNER || DEFAULT_GITHUB_OWNER,
        githubRepo: process.env.GITHUB_REPO || DEFAULT_GITHUB_REPO,
        githubBranch,
        description: `Deployment pipeline for LanguagePeer ${environment} environment`
    });
}
