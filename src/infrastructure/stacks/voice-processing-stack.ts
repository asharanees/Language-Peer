import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface VoiceProcessingStackProps extends cdk.StackProps {
  environment: string;
}

export class VoiceProcessingStack extends cdk.Stack {
  public readonly audioBucket: s3.Bucket;
  public readonly voiceProcessingRole: iam.Role;

  constructor(scope: Construct, id: string, props: VoiceProcessingStackProps) {
    super(scope, id, props);

    // S3 bucket for audio storage
    this.audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `languagepeer-audio-${props.environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldAudioFiles',
          enabled: true,
          expiration: cdk.Duration.days(30)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // IAM role for voice processing services
    this.voiceProcessingRole = new iam.Role(this, 'VoiceProcessingRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        VoiceServicesAccess: new iam.PolicyDocument({
          statements: [
            // Transcribe permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'transcribe:StartStreamTranscription',
                'transcribe:StartTranscriptionJob',
                'transcribe:GetTranscriptionJob',
                'transcribe:ListTranscriptionJobs'
              ],
              resources: ['*']
            }),
            // Polly permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'polly:SynthesizeSpeech',
                'polly:DescribeVoices',
                'polly:GetLexicon',
                'polly:ListLexicons'
              ],
              resources: ['*']
            }),
            // Comprehend permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'comprehend:DetectSyntax',
                'comprehend:DetectEntities',
                'comprehend:DetectSentiment',
                'comprehend:DetectLanguage'
              ],
              resources: ['*']
            }),
            // S3 permissions for audio bucket
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket'
              ],
              resources: [
                this.audioBucket.bucketArn,
                `${this.audioBucket.bucketArn}/*`
              ]
            })
          ]
        })
      }
    });

    // Output important values
    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: this.audioBucket.bucketName,
      description: 'S3 bucket for audio file storage'
    });

    new cdk.CfnOutput(this, 'VoiceProcessingRoleArn', {
      value: this.voiceProcessingRole.roleArn,
      description: 'IAM role for voice processing Lambda functions'
    });
  }
}