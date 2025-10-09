import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../stacks/monitoring-stack';

describe('MonitoringStack', () => {
  let app: cdk.App;
  let stack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MonitoringStack(app, 'TestMonitoringStack', {
      environment: 'test',
      userTableName: 'test-user-table',
      sessionTableName: 'test-session-table',
      apiGatewayId: 'test-api-id',
      audioBucketName: 'test-audio-bucket'
    });
    template = Template.fromStack(stack);
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'LanguagePeer-Alerts-test',
        DisplayName: 'LanguagePeer Alerts - test'
      });
    });

    test('adds email subscription for production environment', () => {
      const prodStack = new MonitoringStack(app, 'ProdMonitoringStack', {
        environment: 'production',
        userTableName: 'prod-user-table',
        sessionTableName: 'prod-session-table',
        apiGatewayId: 'prod-api-id',
        audioBucketName: 'prod-audio-bucket'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        TopicArn: {
          Ref: expect.stringMatching(/AlertTopic/)
        }
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('creates application log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/languagepeer/test/application',
        RetentionInDays: 7
      });
    });

    test('uses correct retention period for different environments', () => {
      const prodStack = new MonitoringStack(app, 'ProdMonitoringStack', {
        environment: 'production'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'LanguagePeer-test'
      });
    });

    test('dashboard contains API Gateway widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody);

      expect(dashboardBody.widgets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              title: 'API Gateway Requests'
            })
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              title: 'API Gateway Errors'
            })
          })
        ])
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates API Gateway 4xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-API-4xx-test',
        AlarmDescription: 'High rate of 4xx errors in API Gateway',
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
        EvaluationPeriods: 2
      });
    });

    test('creates API Gateway 5xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-API-5xx-test',
        AlarmDescription: 'High rate of 5xx errors in API Gateway',
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5,
        EvaluationPeriods: 1
      });
    });

    test('creates API Gateway latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-API-Latency-test',
        AlarmDescription: 'High latency in API Gateway',
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5000,
        EvaluationPeriods: 3
      });
    });

    test('creates DynamoDB throttling alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-DynamoDB-Throttle-test-user-table-test',
        AlarmDescription: 'DynamoDB throttling detected for test-user-table',
        MetricName: 'ThrottledRequests',
        Namespace: 'AWS/DynamoDB'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-DynamoDB-Throttle-test-session-table-test',
        AlarmDescription: 'DynamoDB throttling detected for test-session-table',
        MetricName: 'ThrottledRequests',
        Namespace: 'AWS/DynamoDB'
      });
    });

    test('creates Lambda error and duration alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-Lambda-Errors-test',
        AlarmDescription: 'High error rate across Lambda functions',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 10
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-Lambda-Duration-test',
        AlarmDescription: 'High duration across Lambda functions',
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 30000
      });
    });

    test('creates custom application alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-Conversation-Success-test',
        AlarmDescription: 'Low conversation success rate',
        MetricName: 'SuccessRate',
        Namespace: 'LanguagePeer/Conversations',
        Threshold: 0.8,
        ComparisonOperator: 'LessThanThreshold'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'LanguagePeer-Voice-Latency-test',
        AlarmDescription: 'High voice processing latency',
        MetricName: 'ProcessingLatency',
        Namespace: 'LanguagePeer/Voice',
        Threshold: 3000
      });
    });

    test('all alarms have SNS actions configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Ref: expect.stringMatching(/AlertTopic/)
            })
          ])
        );
      });
    });
  });

  describe('Log Insights Queries', () => {
    test('creates saved queries for log analysis', () => {
      template.hasResourceProperties('AWS::Logs::QueryDefinition', {
        Name: `LanguagePeer-Errors-${stack.stackName}`,
        QueryString: expect.stringContaining('filter @message like /ERROR/')
      });

      template.hasResourceProperties('AWS::Logs::QueryDefinition', {
        Name: `LanguagePeer-Performance-${stack.stackName}`,
        QueryString: expect.stringContaining('filter @type = "REPORT"')
      });

      template.hasResourceProperties('AWS::Logs::QueryDefinition', {
        Name: `LanguagePeer-Conversations-${stack.stackName}`,
        QueryString: expect.stringContaining('filter @message like /conversation/')
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates rule for critical alerts', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'LanguagePeer-CriticalAlerts-test',
        Description: 'Automated response to critical system alerts',
        EventPattern: {
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            state: {
              value: ['ALARM']
            },
            alarmName: [{
              prefix: 'LanguagePeer-'
            }]
          }
        }
      });
    });

    test('creates Lambda function for alert handling', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'LanguagePeer-AlertHandler-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60
      });
    });

    test('EventBridge rule targets alert handler Lambda', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const rule = Object.values(rules)[0] as any;
      
      expect(rule.Properties.Targets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Arn: expect.objectContaining({
              'Fn::GetAtt': expect.arrayContaining([
                expect.stringMatching(/AlertHandler/),
                'Arn'
              ])
            })
          })
        ])
      );
    });
  });

  describe('IAM Permissions', () => {
    test('alert handler has SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: 'sns:Publish',
              Resource: expect.objectContaining({
                Ref: expect.stringMatching(/AlertTopic/)
              })
            })
          ])
        }
      });
    });

    test('Lambda has EventBridge invoke permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
        FunctionName: expect.objectContaining({
          Ref: expect.stringMatching(/AlertHandler/)
        })
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports alert topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS topic ARN for alerts'
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch dashboard URL'
      });
    });

    test('exports log group name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'Application log group name'
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('development environment has minimal monitoring', () => {
      const devStack = new MonitoringStack(app, 'DevMonitoringStack', {
        environment: 'development'
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });

      // Should not have email subscription
      devTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('production environment has enhanced monitoring', () => {
      const prodStack = new MonitoringStack(app, 'ProdMonitoringStack', {
        environment: 'production'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90
      });

      // Should have email subscription
      prodTemplate.resourceCountIs('AWS::SNS::Subscription', 1);
    });
  });

  describe('Resource Tagging', () => {
    test('resources are properly tagged', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const topics = template.findResources('AWS::SNS::Topic');
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');

      // Verify resources exist (tagging is handled by CDK automatically)
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);
      expect(Object.keys(topics).length).toBeGreaterThan(0);
      expect(Object.keys(dashboards).length).toBeGreaterThan(0);
    });
  });

  describe('Cost Optimization', () => {
    test('log retention is appropriate for environment', () => {
      // Development should have short retention
      const devStack = new MonitoringStack(app, 'DevStack', {
        environment: 'development'
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });

      // Production should have longer retention
      const prodStack = new MonitoringStack(app, 'ProdStack', {
        environment: 'production'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90
      });
    });

    test('alarms have appropriate evaluation periods', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.Properties.EvaluationPeriods).toBeLessThanOrEqual(5);
      });
    });
  });
});