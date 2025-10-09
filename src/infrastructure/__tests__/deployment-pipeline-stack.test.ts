import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DeploymentPipelineStack } from '../stacks/deployment-pipeline-stack';

describe('DeploymentPipelineStack', () => {
  let app: cdk.App;
  let stack: DeploymentPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DeploymentPipelineStack(app, 'TestDeploymentPipelineStack', {
      environment: 'test',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'test-branch'
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Artifact Bucket', () => {
    test('creates S3 bucket for pipeline artifacts', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Sub': 'languagepeer-pipeline-test-${AWS::AccountId}'
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('configures lifecycle rules for artifact cleanup', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldArtifacts',
              Status: 'Enabled',
              ExpirationInDays: 30
            }
          ]
        }
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('creates test project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'LanguagePeer-Test-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          EnvironmentVariables: [
            {
              Name: 'ENVIRONMENT',
              Value: 'test'
            },
            {
              Name: 'AWS_DEFAULT_REGION',
              Value: { Ref: 'AWS::Region' }
            }
          ]
        }
      });
    });

    test('creates deploy project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'LanguagePeer-Deploy-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true
        }
      });
    });

    test('configures proper IAM permissions for CodeBuild', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
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
                ':iam::aws:policy/PowerUserAccess'
              ]
            ]
          }
        ]
      });
    });
  });

  describe('CodePipeline', () => {
    test('creates pipeline with correct stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'LanguagePeer-Pipeline-test',
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                Name: 'GitHub_Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'ThirdParty',
                  Provider: 'GitHub',
                  Version: '1'
                },
                Configuration: {
                  Owner: 'test-owner',
                  Repo: 'test-repo',
                  Branch: 'test-branch'
                }
              }
            ]
          },
          {
            Name: 'Test',
            Actions: [
              {
                Name: 'Test_And_Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1'
                }
              }
            ]
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                Name: 'Deploy_Infrastructure',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1'
                },
                RunOrder: 1
              }
            ]
          }
        ]
      });
    });

    test('uses artifact bucket for pipeline storage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
          Location: {
            Ref: expect.stringMatching(/PipelineArtifacts/)
          }
        }
      });
    });
  });

  describe('SSM Parameters', () => {
    test('stores pipeline configuration in SSM', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/languagepeer/test/pipeline/name',
        Type: 'String',
        Value: {
          Ref: expect.stringMatching(/DeploymentPipeline/)
        },
        Description: 'CodePipeline name for LanguagePeer deployment'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the deployment pipeline'
      });
    });

    test('exports pipeline URL', () => {
      template.hasOutput('PipelineUrl', {
        Description: 'URL to view the deployment pipeline'
      });
    });

    test('exports artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'S3 bucket for pipeline artifacts'
      });
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment-specific naming', () => {
      const testStack = new DeploymentPipelineStack(app, 'ProdStack', {
        environment: 'production',
        githubOwner: 'prod-owner',
        githubRepo: 'prod-repo',
        githubBranch: 'main'
      });
      const prodTemplate = Template.fromStack(testStack);

      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'LanguagePeer-Pipeline-production'
      });

      prodTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'LanguagePeer-Test-production'
      });
    });

    test('configures correct branch for production', () => {
      const prodStack = new DeploymentPipelineStack(app, 'ProdStack', {
        environment: 'production',
        githubOwner: 'prod-owner',
        githubRepo: 'prod-repo',
        githubBranch: 'main'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: expect.arrayContaining([
          expect.objectContaining({
            Name: 'Source',
            Actions: expect.arrayContaining([
              expect.objectContaining({
                Configuration: expect.objectContaining({
                  Branch: 'main'
                })
              })
            ])
          })
        ])
      });
    });
  });

  describe('Security', () => {
    test('enables encryption for artifact bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('configures proper IAM permissions', () => {
      // Verify CodeBuild has necessary permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'sts:AssumeRole',
                'cloudformation:*',
                'iam:*'
              ])
            })
          ])
        }
      });
    });
  });
});