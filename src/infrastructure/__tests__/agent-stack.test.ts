import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AgentStack } from '../stacks/agent-stack';

describe('AgentStack', () => {
  let app: cdk.App;
  let stack: AgentStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new AgentStack(app, 'TestAgentStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('IAM Role for Bedrock', () => {
    test('creates Bedrock agent role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('grants Bedrock model access permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel'
              ],
              Resource: [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
                'arn:aws:bedrock:us-east-1::foundation-model/meta.llama3-1-405b-instruct-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0'
              ]
            }
          ]
        }
      });
    });

    test('grants Bedrock Agents permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'bedrock:CreateAgent',
                'bedrock:UpdateAgent',
                'bedrock:GetAgent',
                'bedrock:ListAgents',
                'bedrock:InvokeAgent'
              ],
              Resource: '*'
            }
          ]
        }
      });
    });

    test('includes basic Lambda execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
              ]
            ]
          }
        ]
      });
    });
  });

  describe('Kinesis Stream', () => {
    test('creates analytics stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'LanguagePeer-Analytics-test',
        ShardCount: 1,
        RetentionPeriodHours: 168, // 7 days
        StreamEncryption: {
          EncryptionType: 'KMS',
          KeyId: 'alias/aws/kinesis'
        }
      });
    });

    test('grants Kinesis permissions to Bedrock role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'kinesis:PutRecord',
                'kinesis:PutRecords',
                'kinesis:DescribeStream'
              ]
            }
          ]
        }
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('creates log group for agent activities', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/language-peer-agents-test',
        RetentionInDays: 7
      });
    });

    test('sets correct deletion policy for log group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports Bedrock role ARN', () => {
      template.hasOutput('BedrockRoleArn', {
        Description: 'IAM role for Bedrock agents and AI services'
      });
    });

    test('exports analytics stream name', () => {
      template.hasOutput('AnalyticsStreamName', {
        Description: 'Kinesis stream for real-time analytics'
      });
    });

    test('exports agent log group name', () => {
      template.hasOutput('AgentLogGroupName', {
        Description: 'CloudWatch log group for agent activities'
      });
    });
  });

  describe('Resource Properties', () => {
    test('analytics stream name includes environment', () => {
      expect(stack.analyticsStream.streamName).toBe('LanguagePeer-Analytics-test');
    });

    test('Bedrock role has correct region in model ARNs', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Resource: [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
                'arn:aws:bedrock:us-east-1::foundation-model/meta.llama3-1-405b-instruct-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0'
              ]
            }
          ]
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('enables Kinesis stream encryption', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        StreamEncryption: {
          EncryptionType: 'KMS',
          KeyId: 'alias/aws/kinesis'
        }
      });
    });

    test('follows least privilege principle for Bedrock access', () => {
      // Verify that Bedrock model access is restricted to specific models
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel'
              ],
              Resource: [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
                'arn:aws:bedrock:us-east-1::foundation-model/meta.llama3-1-405b-instruct-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0'
              ]
            }
          ]
        }
      });
    });
  });
});