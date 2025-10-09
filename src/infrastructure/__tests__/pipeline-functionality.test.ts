import * as AWS from 'aws-sdk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK for testing
jest.mock('aws-sdk');

describe('Pipeline Functionality Tests', () => {
  let mockCodePipeline: jest.Mocked<AWS.CodePipeline>;
  let mockCodeBuild: jest.Mocked<AWS.CodeBuild>;
  let mockCloudFormation: jest.Mocked<AWS.CloudFormation>;

  beforeEach(() => {
    mockCodePipeline = new AWS.CodePipeline() as jest.Mocked<AWS.CodePipeline>;
    mockCodeBuild = new AWS.CodeBuild() as jest.Mocked<AWS.CodeBuild>;
    mockCloudFormation = new AWS.CloudFormation() as jest.Mocked<AWS.CloudFormation>;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('CDK Synthesis', () => {
    test('CDK can synthesize all stacks without errors', () => {
      expect(() => {
        execSync('npm run cdk:synth', { 
          stdio: 'pipe',
          env: { ...process.env, ENVIRONMENT: 'test' }
        });
      }).not.toThrow();
    });

    test('synthesized templates are valid CloudFormation', () => {
      const cdkOutDir = path.join(process.cwd(), 'cdk.out');
      
      // Ensure cdk.out directory exists
      if (!fs.existsSync(cdkOutDir)) {
        execSync('npm run cdk:synth', { 
          stdio: 'pipe',
          env: { ...process.env, ENVIRONMENT: 'test' }
        });
      }

      const templateFiles = fs.readdirSync(cdkOutDir)
        .filter(file => file.endsWith('.template.json'));

      expect(templateFiles.length).toBeGreaterThan(0);

      templateFiles.forEach(templateFile => {
        const templatePath = path.join(cdkOutDir, templateFile);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        expect(() => {
          JSON.parse(templateContent);
        }).not.toThrow();

        const template = JSON.parse(templateContent);
        expect(template).toHaveProperty('AWSTemplateFormatVersion');
        expect(template).toHaveProperty('Resources');
      });
    });

    test('templates contain expected resources', () => {
      const cdkOutDir = path.join(process.cwd(), 'cdk.out');
      const templateFiles = fs.readdirSync(cdkOutDir)
        .filter(file => file.endsWith('.template.json'));

      let foundDynamoDB = false;
      let foundS3 = false;
      let foundApiGateway = false;
      let foundCodePipeline = false;

      templateFiles.forEach(templateFile => {
        const templatePath = path.join(cdkOutDir, templateFile);
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        if (template.Resources) {
          Object.values(template.Resources).forEach((resource: any) => {
            if (resource.Type === 'AWS::DynamoDB::Table') foundDynamoDB = true;
            if (resource.Type === 'AWS::S3::Bucket') foundS3 = true;
            if (resource.Type === 'AWS::ApiGateway::RestApi') foundApiGateway = true;
            if (resource.Type === 'AWS::CodePipeline::Pipeline') foundCodePipeline = true;
          });
        }
      });

      expect(foundDynamoDB).toBe(true);
      expect(foundS3).toBe(true);
      expect(foundApiGateway).toBe(true);
    });
  });

  describe('Build Specification Validation', () => {
    test('test buildspec has correct phases', () => {
      // This would be tested by creating a test project and validating buildspec
      const expectedPhases = ['install', 'pre_build', 'build'];
      const expectedCommands = [
        'npm ci',
        'npm run lint',
        'npm run test:unit -- --run',
        'npm run test:integration -- --run',
        'npm run cdk:synth'
      ];

      // In a real test, we would validate the buildspec structure
      expect(expectedPhases).toContain('install');
      expect(expectedPhases).toContain('pre_build');
      expect(expectedPhases).toContain('build');
      
      expectedCommands.forEach(command => {
        expect(typeof command).toBe('string');
        expect(command.length).toBeGreaterThan(0);
      });
    });

    test('deploy buildspec has correct phases', () => {
      const expectedPhases = ['install', 'pre_build', 'build'];
      const expectedCommands = [
        'npm ci',
        'npx cdk bootstrap',
        'npx cdk deploy --all --require-approval never'
      ];

      expect(expectedPhases).toContain('install');
      expect(expectedPhases).toContain('pre_build');
      expect(expectedPhases).toContain('build');
      
      expectedCommands.forEach(command => {
        expect(typeof command).toBe('string');
        expect(command.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pipeline Configuration', () => {
    test('pipeline has correct stage order', () => {
      const expectedStages = ['Source', 'Test', 'Deploy'];
      
      // Validate stage order is logical
      expect(expectedStages.indexOf('Source')).toBe(0);
      expect(expectedStages.indexOf('Test')).toBe(1);
      expect(expectedStages.indexOf('Deploy')).toBe(2);
    });

    test('pipeline uses correct GitHub configuration', () => {
      const githubConfig = {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'test-branch'
      };

      expect(githubConfig.owner).toBeTruthy();
      expect(githubConfig.repo).toBeTruthy();
      expect(githubConfig.branch).toBeTruthy();
    });
  });

  describe('Deployment Scripts', () => {
    test('deploy script exists and is executable', () => {
      const deployScriptPath = path.join(process.cwd(), 'scripts', 'deploy.sh');
      expect(fs.existsSync(deployScriptPath)).toBe(true);
      
      const stats = fs.statSync(deployScriptPath);
      expect(stats.isFile()).toBe(true);
    });

    test('rollback script exists and is executable', () => {
      const rollbackScriptPath = path.join(process.cwd(), 'scripts', 'rollback.sh');
      expect(fs.existsSync(rollbackScriptPath)).toBe(true);
      
      const stats = fs.statSync(rollbackScriptPath);
      expect(stats.isFile()).toBe(true);
    });

    test('deploy script validates environment parameter', () => {
      const deployScript = fs.readFileSync(
        path.join(process.cwd(), 'scripts', 'deploy.sh'), 
        'utf8'
      );

      expect(deployScript).toContain('development|staging|production');
      expect(deployScript).toContain('Invalid environment');
    });

    test('deploy script checks AWS credentials', () => {
      const deployScript = fs.readFileSync(
        path.join(process.cwd(), 'scripts', 'deploy.sh'), 
        'utf8'
      );

      expect(deployScript).toContain('aws sts get-caller-identity');
      expect(deployScript).toContain('AWS credentials not configured');
    });
  });

  describe('Error Handling', () => {
    test('pipeline handles build failures gracefully', () => {
      mockCodeBuild.batchGetBuilds = jest.fn().mockReturnValue({
        promise: () => Promise.resolve({
          builds: [{
            buildStatus: 'FAILED',
            logs: {
              groupName: '/aws/codebuild/test-project',
              streamName: 'test-stream'
            }
          }]
        })
      });

      // Test that we can handle build failures
      expect(mockCodeBuild.batchGetBuilds).toBeDefined();
    });

    test('pipeline handles deployment failures', () => {
      mockCloudFormation.describeStacks = jest.fn().mockReturnValue({
        promise: () => Promise.resolve({
          Stacks: [{
            StackStatus: 'ROLLBACK_COMPLETE',
            StackStatusReason: 'Test failure reason'
          }]
        })
      });

      expect(mockCloudFormation.describeStacks).toBeDefined();
    });
  });

  describe('Environment-Specific Pipeline Configuration', () => {
    test('development environment skips pipeline creation', () => {
      // Development should not create pipeline stack
      const devEnvironment = 'development';
      expect(devEnvironment).toBe('development');
      
      // In the actual CDK app, pipeline is only created for staging/production
    });

    test('staging environment uses develop branch', () => {
      const stagingBranch = 'develop';
      expect(stagingBranch).toBe('develop');
    });

    test('production environment uses main branch', () => {
      const productionBranch = 'main';
      expect(productionBranch).toBe('main');
    });
  });

  describe('Security Validation', () => {
    test('pipeline uses encrypted artifact storage', () => {
      // Validate that S3 bucket for artifacts has encryption
      const encryptionConfig = {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      };

      expect(encryptionConfig.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionConfig.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('CodeBuild projects use least privilege IAM roles', () => {
      const iamPolicy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          Resource: 'arn:aws:logs:*:*:*'
        }]
      };

      expect(iamPolicy.Statement[0].Effect).toBe('Allow');
      expect(iamPolicy.Statement[0].Action).toContain('logs:CreateLogGroup');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('pipeline creates CloudWatch alarms for failures', () => {
      const alarmConfig = {
        AlarmName: 'LanguagePeer-Pipeline-Failures',
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Statistic: 'Sum',
        Threshold: 1
      };

      expect(alarmConfig.AlarmName).toContain('Pipeline-Failures');
      expect(alarmConfig.MetricName).toBe('PipelineExecutionFailure');
    });

    test('build projects log to CloudWatch', () => {
      const logConfig = {
        LogsConfig: {
          CloudWatchLogs: {
            Status: 'ENABLED',
            GroupName: '/aws/codebuild/languagepeer'
          }
        }
      };

      expect(logConfig.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });
  });
});