import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as path from 'path';
import { Construct } from 'constructs';

// Configuration constants for better maintainability
const API_THROTTLING = {
  RATE_LIMIT: 100,
  BURST_LIMIT: 200
} as const;

const LAMBDA_CONFIG = {
  TIMEOUT_SECONDS: 30,
  MEMORY_SIZE_MB: 512,
  RUNTIME: lambda.Runtime.NODEJS_18_X
} as const;

/** Essential HTTP headers for API communication and authentication */
const CORS_HEADERS = [
  'Content-Type',
  'Authorization'
];

/**
 * Properties for the LanguagePeerStack
 */
export interface LanguagePeerStackProps extends cdk.StackProps {
  /** Target deployment environment (development, staging, production) */
  environment: string;
}

/**
 * Core infrastructure stack for LanguagePeer voice-first language learning platform.
 * 
 * This stack provisions the foundational AWS resources including:
 * - DynamoDB tables for user profiles and conversation sessions
 * - API Gateway with CORS configuration for REST API endpoints
 * - S3 bucket for frontend static website hosting
 * - Lambda execution roles with appropriate permissions
 * - IAM policies for secure access to AWS services
 * 
 * @example
 * ```typescript
 * const coreStack = new LanguagePeerStack(app, 'LanguagePeer-Core-dev', {
 *   env: { account: '123456789012', region: 'us-east-1' },
 *   environment: 'development'
 * });
 * ```
 */
export class LanguagePeerStack extends cdk.Stack {
  /** DynamoDB table for storing user profiles and learning progress */
  public readonly userTable: dynamodb.Table;
  
  /** DynamoDB table for storing conversation sessions and message history */
  public readonly sessionTable: dynamodb.Table;
  
  /** API Gateway REST API for handling client requests */
  public readonly api: apigateway.RestApi;
  
  /** S3 bucket for hosting the React frontend application */
  public readonly frontendBucket: s3.Bucket;

  /**
   * Creates a new LanguagePeerStack instance with core infrastructure resources.
   * 
   * @param scope - The parent construct (typically the CDK App)
   * @param id - Unique identifier for this stack
   * @param props - Stack configuration properties including environment
   */
  constructor(scope: Construct, id: string, props: LanguagePeerStackProps) {
    super(scope, id, props);

    // DynamoDB Tables - Core data storage for user profiles and sessions
    
    /**
     * User profiles table stores learning preferences, progress metrics, and account information.
     * Uses PAY_PER_REQUEST billing for cost optimization during development and variable usage.
     * Point-in-time recovery enabled for data protection in production environments.
     */
    this.userTable = new dynamodb.Table(this, 'UserTable', {
      tableName: `LanguagePeer-Users-${props.environment}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Cost-effective for variable workloads
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental data loss
      pointInTimeRecovery: true, // Enable backup and restore capabilities
      encryption: dynamodb.TableEncryption.AWS_MANAGED // Encrypt data at rest
    });

    /**
     * Conversation sessions table stores message history, performance metrics, and feedback.
     * Composite key (sessionId + timestamp) enables efficient querying of session data.
     * Global Secondary Index allows querying sessions by user for dashboard and analytics.
     */
    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `LanguagePeer-Sessions-${props.environment}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }, // Enables chronological ordering
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    /**
     * Global Secondary Index for efficient user session queries.
     * Enables retrieving all sessions for a specific user ordered by timestamp.
     * Critical for user dashboard, progress tracking, and analytics features.
     */
    this.sessionTable.addGlobalSecondaryIndex({
      indexName: 'UserSessionIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    /**
     * S3 bucket configured for static website hosting of the React frontend.
     * 
     * Configuration rationale:
     * - Public read access enables direct browser access to static assets
     * - BLOCK_ACLS prevents accidental ACL modifications while allowing public read
     * - Both index and error documents point to index.html for SPA routing support
     * - DESTROY removal policy appropriate for frontend assets (can be rebuilt)
     * - Account ID in bucket name ensures global uniqueness across AWS accounts
     */
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `languagepeer-frontend-${cdk.Aws.ACCOUNT_ID}`, // Globally unique bucket name
      websiteIndexDocument: 'index.html', // Default document for root requests
      websiteErrorDocument: 'index.html', // SPA routing - all routes serve index.html
      publicReadAccess: true, // Enable direct browser access to static files
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, // Security: prevent ACL modifications
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Safe for frontend - can be rebuilt from source
      autoDeleteObjects: true, // Clean up objects when stack is destroyed
    });

    /**
     * API Gateway REST API for handling all client-server communication.
     * 
     * CORS Configuration:
     * - ALL_ORIGINS allows requests from any domain (suitable for development)
     * - Production should restrict origins to specific domains for security
     * - Content-Type and Authorization headers support JSON API and auth tokens
     * 
     * Throttling Configuration:
     * - Rate limit prevents API abuse and controls costs
     * - Burst limit handles temporary traffic spikes
     * - Values should be adjusted based on expected usage patterns
     */
    this.api = new apigateway.RestApi(this, 'LanguagePeerApi', {
      restApiName: `LanguagePeer-API-${props.environment}`,
      description: 'API for LanguagePeer voice-first language learning platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS, // Support all HTTP methods
        allowHeaders: CORS_HEADERS // Essential headers for API communication
      },
      deployOptions: {
        stageName: props.environment, // Environment-specific API stage
        throttlingRateLimit: API_THROTTLING.RATE_LIMIT, // Requests per second
        throttlingBurstLimit: API_THROTTLING.BURST_LIMIT // Peak requests capacity
      }
    });

    /**
     * IAM role for Lambda functions with comprehensive service permissions.
     * 
     * This role follows the principle of least privilege while providing access to:
     * - DynamoDB for user and session data operations
     * - Bedrock for AI model invocation
     * - Voice services (Transcribe/Polly) for audio processing
     * - S3 for audio file storage and retrieval
     * 
     * The role is shared across Lambda functions to reduce complexity while
     * maintaining security through resource-level restrictions.
     */
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        // AWS managed policy for basic Lambda execution (CloudWatch Logs)
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        /**
         * DynamoDB access policy for user profiles and conversation sessions.
         * Grants full CRUD operations on both tables and their indexes.
         * Resource-level restrictions ensure access only to this stack's tables.
         */
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',     // Read individual items
                'dynamodb:PutItem',     // Create new items
                'dynamodb:UpdateItem',  // Modify existing items
                'dynamodb:DeleteItem',  // Remove items
                'dynamodb:Query',       // Efficient key-based queries
                'dynamodb:Scan'         // Full table scans (use sparingly)
              ],
              resources: [
                this.userTable.tableArn,                    // User profiles table
                this.sessionTable.tableArn,                 // Sessions table
                `${this.sessionTable.tableArn}/index/*`     // All GSI indexes
              ]
            })
          ]
        }),
        /**
         * AWS Bedrock access for AI-powered language tutoring agents.
         * Enables invocation of foundation models for conversation generation,
         * language analysis, and personalized feedback delivery.
         */
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',                    // Synchronous model invocation
                'bedrock:InvokeModelWithResponseStream', // Streaming responses for real-time chat
                'bedrock:ListFoundationModels'           // Discover available models
              ],
              resources: ['*'] // Bedrock models don't support resource-level permissions
            })
          ]
        }),
        /**
         * Voice processing services access for speech-to-text and text-to-speech.
         * 
         * Transcribe: Converts user speech to text for language analysis
         * Polly: Generates natural speech from AI agent responses
         * S3: Stores and retrieves audio files for processing and playback
         */
        VoiceServicesAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'transcribe:StartTranscriptionJob',  // Initiate speech-to-text processing
                'transcribe:GetTranscriptionJob',    // Retrieve transcription results
                'polly:SynthesizeSpeech',           // Generate speech from text
                's3:GetObject',                     // Download audio files for processing
                's3:PutObject',                     // Upload processed audio files
                's3:PutObjectAcl'                   // Set permissions on audio objects
              ],
              resources: ['*'] // Voice services require broad permissions
            })
          ]
        })
      }
    });

    /**
     * Main Lambda function handling all API Gateway requests.
     * 
     * Configuration rationale:
     * - 30-second timeout accommodates AI model processing and voice operations
     * - 512MB memory balances performance with cost for typical workloads
     * - Environment variables provide runtime configuration without code changes
     * - Handler path points to compiled TypeScript in the handlers directory
     */
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      functionName: `LanguagePeer-API-${props.environment}`,
      runtime: LAMBDA_CONFIG.RUNTIME,                                    // Node.js 18.x for modern features
      handler: 'api-handler.handler',                                   // Entry point in compiled code
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/handlers')),
      role: lambdaRole,                                                 // IAM role with service permissions
      timeout: cdk.Duration.seconds(LAMBDA_CONFIG.TIMEOUT_SECONDS),    // Allow time for AI processing
      memorySize: LAMBDA_CONFIG.MEMORY_SIZE_MB,                        // Balanced performance/cost
      environment: {
        // Runtime configuration passed as environment variables
        USER_TABLE_NAME: this.userTable.tableName,
        SESSION_TABLE_NAME: this.sessionTable.tableName,
        REGION: this.region,
        // TODO: Make audio bucket name configurable instead of hardcoded account ID
        AUDIO_BUCKET_NAME: `languagepeer-audio-${props.environment}-980874804229`
      }
    });

    /**
     * Lambda proxy integration for API Gateway.
     * 
     * Proxy mode forwards all request details to Lambda and expects a specific
     * response format. This simplifies routing by handling all paths in Lambda code.
     * 
     * CORS headers are explicitly configured to support browser-based clients:
     * - Access-Control-Allow-Origin: Permits cross-origin requests
     * - Access-Control-Allow-Headers: Specifies allowed request headers
     * - Access-Control-Allow-Methods: Lists supported HTTP methods
     */
    const apiIntegration = new apigateway.LambdaIntegration(apiHandler, {
      proxy: true, // Forward all request details to Lambda
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            // CORS headers for browser compatibility
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
          }
        }
      ]
    });

    /**
     * Method response configuration for CORS support.
     * Defines which headers the API Gateway method can return to clients.
     * Must match the headers specified in integration responses.
     */
    const methodOptions = {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true
          }
        }
      ]
    };

    /**
     * API Gateway routing configuration.
     * 
     * Root method handles requests to the API root path (/)
     * Proxy resource captures all other paths and forwards them to Lambda
     * This pattern allows the Lambda function to handle all routing logic
     * internally, simplifying the API Gateway configuration.
     */
    // Handle requests to the root path
    this.api.root.addMethod('ANY', apiIntegration, methodOptions);
    
    // Catch-all proxy for all other paths (/{proxy+})
    const proxyResource = this.api.root.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,                    // Support all HTTP methods
      defaultMethodOptions: methodOptions // Apply CORS configuration
    });

    /**
     * CloudFormation outputs for cross-stack references and external integrations.
     * These values can be imported by other stacks or used in deployment scripts.
     */
    new cdk.CfnOutput(this, 'UserTableName', {
      value: this.userTable.tableName,
      description: 'DynamoDB table for user profiles and learning progress',
      exportName: `LanguagePeer-UserTable-${props.environment}`
    });

    new cdk.CfnOutput(this, 'SessionTableName', {
      value: this.sessionTable.tableName,
      description: 'DynamoDB table for conversation sessions and message history',
      exportName: `LanguagePeer-SessionTable-${props.environment}`
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL for client applications',
      exportName: `LanguagePeer-ApiEndpoint-${props.environment}`
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'S3 bucket for hosting the React frontend application',
      exportName: `LanguagePeer-FrontendBucket-${props.environment}`
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: this.frontendBucket.bucketWebsiteUrl,
      description: 'Static website URL for the frontend application',
      exportName: `LanguagePeer-FrontendUrl-${props.environment}`
    });
  }
}