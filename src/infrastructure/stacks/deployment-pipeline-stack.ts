import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DeploymentPipelineStackProps extends cdk.StackProps {
  environment: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class DeploymentPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DeploymentPipelineStackProps) {
    super(scope, id, props);

    // S3 bucket for pipeline artifacts
    this.artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `languagepeer-pipeline-${props.environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CodeBuild service role
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
      ],
      inlinePolicies: {
        CDKDeployPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sts:AssumeRole',
                'cloudformation:*',
                'iam:*',
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:PutParameter'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Build project for testing
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `LanguagePeer-Test-${props.environment}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        environmentVariables: {
          ENVIRONMENT: { value: props.environment },
          AWS_DEFAULT_REGION: { value: this.region }
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18'
            },
            commands: [
              'npm ci',
              'cd src/frontend && npm ci'
            ]
          },
          pre_build: {
            commands: [
              'echo Running tests...',
              'npm run lint',
              'npm run test:unit -- --run',
              'npm run test:integration -- --run'
            ]
          },
          build: {
            commands: [
              'echo Building frontend...',
              'cd src/frontend && npm run build',
              'cd ../..',
              'echo Synthesizing CDK...',
              'npm run cdk:synth'
            ]
          }
        },
        artifacts: {
          files: [
            '**/*'
          ]
        }
      })
    });

    // Build project for deployment
    const deployProject = new codebuild.Project(this, 'DeployProject', {
      projectName: `LanguagePeer-Deploy-${props.environment}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
        environmentVariables: {
          ENVIRONMENT: { value: props.environment },
          AWS_DEFAULT_REGION: { value: this.region }
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18'
            },
            commands: [
              'npm ci'
            ]
          },
          pre_build: {
            commands: [
              'echo Bootstrapping CDK...',
              'npx cdk bootstrap'
            ]
          },
          build: {
            commands: [
              'echo Deploying infrastructure...',
              `npx cdk deploy --all --require-approval never --context environment=${props.environment}`,
              'echo Deployment completed successfully'
            ]
          }
        }
      })
    });

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'DeploymentPipeline', {
      pipelineName: `LanguagePeer-Pipeline-${props.environment}`,
      artifactBucket: this.artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: props.githubOwner,
              repo: props.githubRepo,
              branch: props.githubBranch,
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Test',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Test_And_Build',
              project: testProject,
              input: sourceOutput,
              outputs: [testOutput]
            })
          ]
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Deploy_Infrastructure',
              project: deployProject,
              input: testOutput,
              runOrder: 1
            })
          ]
        }
      ]
    });

    // Store pipeline configuration in SSM
    new ssm.StringParameter(this, 'PipelineNameParameter', {
      parameterName: `/languagepeer/${props.environment}/pipeline/name`,
      stringValue: this.pipeline.pipelineName,
      description: 'CodePipeline name for LanguagePeer deployment'
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Name of the deployment pipeline'
    });

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
      description: 'URL to view the deployment pipeline'
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts'
    });
  }
}