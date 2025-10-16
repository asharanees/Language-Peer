import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AgentStackProps extends cdk.StackProps {
  environment: string;
}

export class AgentStack extends cdk.Stack {
  public readonly bedrockRole: iam.Role;
  public readonly analyticsStream: kinesis.Stream;
  public readonly agentLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, props);

    // IAM role for Bedrock agents and AI services
    this.bedrockRole = new iam.Role(this, 'BedrockAgentRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            // Bedrock foundation model access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel'
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/meta.llama3-1-70b-instruct-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-pro-v1:0`
              ]
            }),
            // Bedrock Agents access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:CreateAgent',
                'bedrock:UpdateAgent',
                'bedrock:GetAgent',
                'bedrock:ListAgents',
                'bedrock:InvokeAgent'
              ],
              resources: ['*']
            }),
            // Kinesis analytics stream access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kinesis:PutRecord',
                'kinesis:PutRecords',
                'kinesis:DescribeStream'
              ],
              resources: [this.analyticsStream?.streamArn || '*']
            })
          ]
        })
      }
    });

    // Kinesis stream for real-time analytics
    this.analyticsStream = new kinesis.Stream(this, 'AnalyticsStream', {
      streamName: `LanguagePeer-Analytics-${props.environment}`,
      shardCount: 1,
      retentionPeriod: cdk.Duration.days(7),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: undefined // Use default KMS key
    });

    // Update the Bedrock role to include the analytics stream ARN
    this.bedrockRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kinesis:PutRecord',
          'kinesis:PutRecords',
          'kinesis:DescribeStream'
        ],
        resources: [this.analyticsStream.streamArn]
      })
    );

    // CloudWatch log group for agent activities
    this.agentLogGroup = new logs.LogGroup(this, 'AgentLogGroup', {
      logGroupName: `/aws/lambda/language-peer-agents-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Output important values
    new cdk.CfnOutput(this, 'BedrockRoleArn', {
      value: this.bedrockRole.roleArn,
      description: 'IAM role for Bedrock agents and AI services'
    });

    new cdk.CfnOutput(this, 'AnalyticsStreamName', {
      value: this.analyticsStream.streamName,
      description: 'Kinesis stream for real-time analytics'
    });

    new cdk.CfnOutput(this, 'AgentLogGroupName', {
      value: this.agentLogGroup.logGroupName,
      description: 'CloudWatch log group for agent activities'
    });
  }
}