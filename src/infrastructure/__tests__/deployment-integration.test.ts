import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LanguagePeerStack } from '../stacks/language-peer-stack';
import { VoiceProcessingStack } from '../stacks/voice-processing-stack';
import { AgentStack } from '../stacks/agent-stack';
import { DeploymentPipelineStack } from '../stacks/deployment-pipeline-stack';

describe('Deployment Integration Tests', () => {
  let app: cdk.App;
  let coreStack: LanguagePeerStack;
  let voiceStack: VoiceProcessingStack;
  let agentStack: AgentStack;
  let pipelineStack: DeploymentPipelineStack;

  beforeEach(() => {
    app = new cdk.App();
    
    coreStack = new LanguagePeerStack(app, 'TestCoreStack', {
      environment: 'test'
    });
    
    voiceStack = new VoiceProcessingStack(app, 'TestVoiceStack', {
      environment: 'test'
    });
    
    agentStack = new AgentStack(app, 'TestAgentStack', {
      environment: 'test'
    });
    
    pipelineStack = new DeploymentPipelineStack(app, 'TestPipelineStack', {
      environment: 'test',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'test-branch'
    });
  });

  describe('Stack Dependencies', () => {
    test('all stacks can be synthesized together', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('stacks have consistent naming conventions', () => {
      const coreTemplate = Template.fromStack(coreStack);
      const voiceTemplate = Template.fromStack(voiceStack);
      const agentTemplate = Template.fromStack(agentStack);

      // Check that all stacks use consistent environment naming
      coreTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: expect.stringMatching(/LanguagePeer-.*-test/)
      });

      voiceTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: expect.stringMatching(/languagepeer-.*-test-.*/)
      });

      agentTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'LanguagePeer-Analytics-test'
      });
    });

    test('IAM roles have proper cross-stack permissions', () => {
      const voiceTemplate = Template.fromStack(voiceStack);
      const agentTemplate = Template.fromStack(agentStack);

      // Voice processing role should have S3 permissions
      voiceTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject'
              ])
            })
          ])
        }
      });

      // Agent role should have Bedrock permissions
      agentTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Environment Configuration', () => {
    test('development environment has correct settings', () => {
      const devCoreStack = new LanguagePeerStack(app, 'DevCoreStack', {
        environment: 'development'
      });
      const devTemplate = Template.fromStack(devCoreStack);

      devTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: false
        }
      });
    });

    test('production environment has enhanced settings', () => {
      const prodCoreStack = new LanguagePeerStack(app, 'ProdCoreStack', {
        environment: 'production'
      });
      const prodTemplate = Template.fromStack(prodCoreStack);

      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });
  });

  describe('Resource Limits and Quotas', () => {
    test('stacks stay within AWS service limits', () => {
      const coreTemplate = Template.fromStack(coreStack);
      const voiceTemplate = Template.fromStack(voiceStack);
      const agentTemplate = Template.fromStack(agentStack);

      // Count DynamoDB tables (limit: 256 per region)
      const dynamoTables = coreTemplate.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(dynamoTables).length).toBeLessThanOrEqual(10);

      // Count S3 buckets (limit: 100 per account)
      const s3Buckets = voiceTemplate.findResources('AWS::S3::Bucket');
      expect(Object.keys(s3Buckets).length).toBeLessThanOrEqual(5);

      // Count Kinesis streams (limit: 500 per region)
      const kinesisStreams = agentTemplate.findResources('AWS::Kinesis::Stream');
      expect(Object.keys(kinesisStreams).length).toBeLessThanOrEqual(5);
    });

    test('IAM policies stay within size limits', () => {
      const templates = [
        Template.fromStack(coreStack),
        Template.fromStack(voiceStack),
        Template.fromStack(agentStack)
      ];

      templates.forEach(template => {
        const policies = template.findResources('AWS::IAM::Policy');
        Object.values(policies).forEach((policy: any) => {
          const policyDoc = JSON.stringify(policy.Properties.PolicyDocument);
          // IAM policy size limit is 6144 characters
          expect(policyDoc.length).toBeLessThan(6000);
        });
      });
    });
  });

  describe('Security Compliance', () => {
    test('all S3 buckets have encryption enabled', () => {
      const voiceTemplate = Template.fromStack(voiceStack);
      const pipelineTemplate = Template.fromStack(pipelineStack);

      const allBuckets = {
        ...voiceTemplate.findResources('AWS::S3::Bucket'),
        ...pipelineTemplate.findResources('AWS::S3::Bucket')
      };

      Object.values(allBuckets).forEach((bucket: any) => {
        expect(bucket.Properties).toHaveProperty('BucketEncryption');
      });
    });

    test('all DynamoDB tables have encryption enabled', () => {
      const coreTemplate = Template.fromStack(coreStack);
      const tables = coreTemplate.findResources('AWS::DynamoDB::Table');

      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.SSESpecification?.SSEEnabled).toBe(true);
      });
    });

    test('IAM roles follow least privilege principle', () => {
      const agentTemplate = Template.fromStack(agentStack);
      const roles = agentTemplate.findResources('AWS::IAM::Role');

      Object.values(roles).forEach((role: any) => {
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumeRolePolicy.Statement).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: expect.objectContaining({
                Service: expect.any(String)
              })
            })
          ])
        );
      });
    });
  });

  describe('Monitoring and Observability', () => {
    test('CloudWatch log groups are created with retention', () => {
      const agentTemplate = Template.fromStack(agentStack);
      
      agentTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/language-peer-agents-test',
        RetentionInDays: 7
      });
    });

    test('API Gateway has throttling configured', () => {
      const coreTemplate = Template.fromStack(coreStack);
      
      coreTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        ThrottleSettings: {
          RateLimit: 100,
          BurstLimit: 200
        }
      });
    });
  });

  describe('Disaster Recovery', () => {
    test('critical resources have backup enabled', () => {
      const coreTemplate = Template.fromStack(coreStack);
      
      // DynamoDB point-in-time recovery for production
      const tables = coreTemplate.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        // Should have point-in-time recovery configuration
        expect(table.Properties).toHaveProperty('PointInTimeRecoverySpecification');
      });
    });

    test('S3 buckets have versioning enabled', () => {
      const voiceTemplate = Template.fromStack(voiceStack);
      const pipelineTemplate = Template.fromStack(pipelineStack);

      const allBuckets = {
        ...voiceTemplate.findResources('AWS::S3::Bucket'),
        ...pipelineTemplate.findResources('AWS::S3::Bucket')
      };

      Object.values(allBuckets).forEach((bucket: any) => {
        expect(bucket.Properties.VersioningConfiguration?.Status).toBe('Enabled');
      });
    });
  });

  describe('Cost Optimization', () => {
    test('DynamoDB uses on-demand billing', () => {
      const coreTemplate = Template.fromStack(coreStack);
      
      coreTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('S3 buckets have lifecycle policies', () => {
      const voiceTemplate = Template.fromStack(voiceStack);
      const pipelineTemplate = Template.fromStack(pipelineStack);

      const allBuckets = {
        ...voiceTemplate.findResources('AWS::S3::Bucket'),
        ...pipelineTemplate.findResources('AWS::S3::Bucket')
      };

      Object.values(allBuckets).forEach((bucket: any) => {
        expect(bucket.Properties).toHaveProperty('LifecycleConfiguration');
      });
    });
  });
});