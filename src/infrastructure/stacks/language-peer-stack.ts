import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface LanguagePeerStackProps extends cdk.StackProps {
  environment: string;
}

export class LanguagePeerStack extends cdk.Stack {
  public readonly userTable: dynamodb.Table;
  public readonly sessionTable: dynamodb.Table;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: LanguagePeerStackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    this.userTable = new dynamodb.Table(this, 'UserTable', {
      tableName: `LanguagePeer-Users-${props.environment}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `LanguagePeer-Sessions-${props.environment}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Add GSI for user sessions
    this.sessionTable.addGlobalSecondaryIndex({
      indexName: 'UserSessionIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'LanguagePeerApi', {
      restApiName: `LanguagePeer-API-${props.environment}`,
      description: 'API for LanguagePeer voice-first language learning platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      },
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200
      }
    });

    // Lambda execution role with necessary permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              resources: [
                this.userTable.tableArn,
                this.sessionTable.tableArn,
                `${this.sessionTable.tableArn}/index/*`
              ]
            })
          ]
        })
      }
    });

    // Output important values
    new cdk.CfnOutput(this, 'UserTableName', {
      value: this.userTable.tableName,
      description: 'DynamoDB table for user profiles'
    });

    new cdk.CfnOutput(this, 'SessionTableName', {
      value: this.sessionTable.tableName,
      description: 'DynamoDB table for conversation sessions'
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}