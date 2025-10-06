import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VoiceProcessingStack } from '../stacks/voice-processing-stack';

describe('VoiceProcessingStack', () => {
  let app: cdk.App;
  let stack: VoiceProcessingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VoiceProcessingStack(app, 'TestVoiceProcessingStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('creates audio bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'languagepeer-audio-test-123456789012',
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
        },
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedMethods: ['GET', 'PUT', 'POST'],
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              MaxAge: 3000
            }
          ]
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldAudioFiles',
              Status: 'Enabled',
              ExpirationInDays: 30
            }
          ]
        }
      });
    });

    test('sets correct bucket retention policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain'
      });
    });
  });

  describe('IAM Role', () => {
    test('creates voice processing role with correct trust policy', () => {
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

    test('grants Transcribe permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'transcribe:StartStreamTranscription',
                'transcribe:StartTranscriptionJob',
                'transcribe:GetTranscriptionJob',
                'transcribe:ListTranscriptionJobs'
              ],
              Resource: '*'
            }
          ]
        }
      });
    });

    test('grants Polly permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'polly:SynthesizeSpeech',
                'polly:DescribeVoices',
                'polly:GetLexicon',
                'polly:ListLexicons'
              ],
              Resource: '*'
            }
          ]
        }
      });
    });

    test('grants Comprehend permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'comprehend:DetectSyntax',
                'comprehend:DetectEntities',
                'comprehend:DetectSentiment',
                'comprehend:DetectLanguage'
              ],
              Resource: '*'
            }
          ]
        }
      });
    });

    test('grants S3 permissions for audio bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket'
              ]
            }
          ]
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports audio bucket name', () => {
      template.hasOutput('AudioBucketName', {
        Description: 'S3 bucket for audio file storage'
      });
    });

    test('exports voice processing role ARN', () => {
      template.hasOutput('VoiceProcessingRoleArn', {
        Description: 'IAM role for voice processing Lambda functions'
      });
    });
  });

  describe('Resource Properties', () => {
    test('bucket name includes environment and account', () => {
      expect(stack.audioBucket.bucketName).toBe('languagepeer-audio-test-123456789012');
    });

    test('voice processing role has correct managed policies', () => {
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

  describe('Security Configuration', () => {
    test('enables S3 bucket encryption', () => {
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

    test('enables S3 bucket versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });
});