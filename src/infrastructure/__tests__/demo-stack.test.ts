import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DemoStack } from '../stacks/demo-stack';

describe('DemoStack', () => {
  let app: cdk.App;
  let stack: DemoStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DemoStack(app, 'TestDemoStack', {
      environment: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Website Hosting', () => {
    test('creates S3 bucket for demo website', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Sub': 'languagepeer-demo-test-${AWS::AccountId}'
        },
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'error.html'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: false,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: false
        }
      });
    });

    test('configures bucket for website hosting', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'error.html'
        }
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            CachePolicyId: expect.any(String)
          },
          DefaultRootObject: 'index.html',
          Enabled: true,
          PriceClass: 'PriceClass_100'
        }
      });
    });

    test('configures custom error responses', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: [
            {
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
              ErrorCachingMinTTL: 300
            }
          ]
        }
      });
    });
  });

  describe('DynamoDB Demo Data Table', () => {
    test('creates demo data table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'LanguagePeer-DemoData-test',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'type',
            KeyType: 'RANGE'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('creates GSI for querying by type', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TypeIndex',
            KeySchema: [
              {
                AttributeName: 'type',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'id',
                KeyType: 'RANGE'
              }
            ]
          }
        ]
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates demo data seeder function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'LanguagePeer-DemoSeeder-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300
      });
    });

    test('creates demo API handler function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'LanguagePeer-DemoAPI-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
    });

    test('seeder function has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'LanguagePeer-DemoSeeder-test',
        Environment: {
          Variables: {
            DEMO_TABLE_NAME: {
              Ref: expect.stringMatching(/DemoDataTable/)
            }
          }
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('creates demo API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'LanguagePeer-Demo-API-test',
        Description: 'Demo API for LanguagePeer showcase'
      });
    });

    test('configures CORS for all origins', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          IntegrationResponses: [
            {
              StatusCode: '200',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,HEAD,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
              }
            }
          ]
        }
      });
    });

    test('creates demo resource endpoints', () => {
      // Check for /demo resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'demo'
      });

      // Check for /demo/users resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users'
      });

      // Check for /demo/sessions resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'sessions'
      });

      // Check for /demo/health resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });
    });

    test('creates GET methods for demo endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        }
      });
    });
  });

  describe('IAM Permissions', () => {
    test('seeder function has DynamoDB write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'dynamodb:PutItem',
                'dynamodb:UpdateItem'
              ])
            })
          ])
        }
      });
    });

    test('API handler has DynamoDB read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ])
            })
          ])
        }
      });
    });

    test('CloudFormation has permission to invoke seeder', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'cloudformation.amazonaws.com'
      });
    });
  });

  describe('S3 Bucket Deployment', () => {
    test('creates bucket deployment for website files', () => {
      template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
        ServiceToken: expect.stringMatching(/BucketDeployment/)
      });
    });
  });

  describe('Custom Resource for Data Seeding', () => {
    test('creates custom resource to trigger data seeding', () => {
      template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
        ServiceToken: {
          'Fn::GetAtt': [
            expect.stringMatching(/DemoDataSeeder/),
            'Arn'
          ]
        },
        Version: '1.0.0'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports demo website URL', () => {
      template.hasOutput('DemoWebsiteUrl', {
        Description: 'Demo website URL'
      });
    });

    test('exports demo API URL', () => {
      template.hasOutput('DemoApiUrl', {
        Description: 'Demo API base URL'
      });
    });

    test('exports health check URL', () => {
      template.hasOutput('DemoHealthCheckUrl', {
        Description: 'Demo API health check endpoint'
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('uses environment in resource naming', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: expect.stringContaining('test')
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: expect.stringContaining('test')
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: expect.stringContaining('test')
      });
    });
  });

  describe('Cost Optimization', () => {
    test('uses pay-per-request billing for DynamoDB', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('uses lowest price class for CloudFront', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_100'
        }
      });
    });

    test('configures auto-delete for demo resources', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket blocks public ACLs but allows public read', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: false,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: false
        }
      });
    });

    test('CloudFront enforces HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        }
      });
    });
  });
});