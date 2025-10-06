import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LanguagePeerStack } from '../stacks/language-peer-stack';

describe('LanguagePeerStack', () => {
  let app: cdk.App;
  let stack: LanguagePeerStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new LanguagePeerStack(app, 'TestLanguagePeerStack', {
      environment: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    test('creates user table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'LanguagePeer-Users-test',
        AttributeDefinitions: [
          {
            AttributeName: 'userId',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });

    test('creates session table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'LanguagePeer-Sessions-test',
        AttributeDefinitions: [
          {
            AttributeName: 'sessionId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N'
          },
          {
            AttributeName: 'userId',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserSessionIndex',
            KeySchema: [
              {
                AttributeName: 'userId',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ]
          }
        ]
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'LanguagePeer-API-test',
        Description: 'API for LanguagePeer voice-first language learning platform'
      });
    });

    test('configures CORS for API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          IntegrationResponses: [
            {
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods': "'*'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
              }
            }
          ]
        }
      });
    });

    test('creates deployment with correct stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        StageName: 'test'
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Lambda execution role with DynamoDB permissions', () => {
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
        },
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

    test('grants DynamoDB permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ]
            }
          ]
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports user table name', () => {
      template.hasOutput('UserTableName', {
        Description: 'DynamoDB table for user profiles'
      });
    });

    test('exports session table name', () => {
      template.hasOutput('SessionTableName', {
        Description: 'DynamoDB table for conversation sessions'
      });
    });

    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL'
      });
    });
  });

  describe('Resource Naming', () => {
    test('uses environment-specific naming', () => {
      expect(stack.userTable.tableName).toBe('LanguagePeer-Users-test');
      expect(stack.sessionTable.tableName).toBe('LanguagePeer-Sessions-test');
    });
  });

  describe('Security Configuration', () => {
    test('enables encryption for DynamoDB tables', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });

    test('enables point-in-time recovery for tables', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });
  });
});