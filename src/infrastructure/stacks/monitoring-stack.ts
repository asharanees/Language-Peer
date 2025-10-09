import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { getEnvironmentConfig } from '../config/environments';

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  userTableName?: string;
  sessionTableName?: string;
  apiGatewayId?: string;
  audioBucketName?: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const config = getEnvironmentConfig(props.environment);

    // SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `LanguagePeer-Alerts-${props.environment}`,
      displayName: `LanguagePeer Alerts - ${props.environment}`,
      fifo: false
    });

    // Add email subscription for production alerts
    if (props.environment === 'production') {
      this.alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(
          process.env.ALERT_EMAIL || 'alerts@languagepeer.com'
        )
      );
    }

    // Central log group for application logs
    this.logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/languagepeer/${props.environment}/application`,
      retention: this.getLogRetention(config.monitoring.logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'LanguagePeerDashboard', {
      dashboardName: `LanguagePeer-${props.environment}`,
      defaultInterval: cdk.Duration.hours(1)
    });

    // Create metrics and alarms
    this.createApiMetricsAndAlarms(props);
    this.createDynamoDBMetricsAndAlarms(props);
    this.createS3MetricsAndAlarms(props);
    this.createLambdaMetricsAndAlarms(props);
    this.createCustomMetricsAndAlarms(props);

    // Create dashboard widgets
    this.createDashboardWidgets(props);

    // Create log insights queries
    this.createLogInsightsQueries();

    // Create EventBridge rules for automated responses
    this.createEventBridgeRules(props);

    // Outputs
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS topic ARN for alerts'
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL'
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'Application log group name'
    });
  }

  private getLogRetention(days: number): logs.RetentionDays {
    const retentionMap: { [key: number]: logs.RetentionDays } = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      120: logs.RetentionDays.FOUR_MONTHS,
      150: logs.RetentionDays.FIVE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
      400: logs.RetentionDays.THIRTEEN_MONTHS,
      545: logs.RetentionDays.EIGHTEEN_MONTHS,
      731: logs.RetentionDays.TWO_YEARS,
      1827: logs.RetentionDays.FIVE_YEARS,
      3653: logs.RetentionDays.TEN_YEARS
    };

    return retentionMap[days] || logs.RetentionDays.ONE_WEEK;
  }

  private createApiMetricsAndAlarms(props: MonitoringStackProps) {
    if (!props.apiGatewayId) return;

    // API Gateway 4XX errors
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      alarmName: `LanguagePeer-API-4xx-${props.environment}`,
      alarmDescription: 'High rate of 4xx errors in API Gateway',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: `LanguagePeer-API-${props.environment}`
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    api4xxAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );

    // API Gateway 5XX errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `LanguagePeer-API-5xx-${props.environment}`,
      alarmDescription: 'High rate of 5xx errors in API Gateway',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: `LanguagePeer-API-${props.environment}`
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    api5xxAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );

    // API Gateway latency
    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: `LanguagePeer-API-Latency-${props.environment}`,
      alarmDescription: 'High latency in API Gateway',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: `LanguagePeer-API-${props.environment}`
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    apiLatencyAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );
  }

  private createDynamoDBMetricsAndAlarms(props: MonitoringStackProps) {
    const tables = [props.userTableName, props.sessionTableName].filter(Boolean);

    tables.forEach(tableName => {
      if (!tableName) return;

      // DynamoDB throttling alarm
      const throttleAlarm = new cloudwatch.Alarm(this, `DynamoThrottle-${tableName}`, {
        alarmName: `LanguagePeer-DynamoDB-Throttle-${tableName}-${props.environment}`,
        alarmDescription: `DynamoDB throttling detected for ${tableName}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tableName
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5)
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });

      throttleAlarm.addAlarmAction(
        new cloudwatch.SnsAction(this.alertTopic)
      );

      // DynamoDB error rate alarm
      const errorAlarm = new cloudwatch.Alarm(this, `DynamoErrors-${tableName}`, {
        alarmName: `LanguagePeer-DynamoDB-Errors-${tableName}-${props.environment}`,
        alarmDescription: `High error rate for DynamoDB table ${tableName}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'SystemErrors',
          dimensionsMap: {
            TableName: tableName
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5)
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });

      errorAlarm.addAlarmAction(
        new cloudwatch.SnsAction(this.alertTopic)
      );
    });
  }

  private createS3MetricsAndAlarms(props: MonitoringStackProps) {
    if (!props.audioBucketName) return;

    // S3 4XX errors
    const s34xxAlarm = new cloudwatch.Alarm(this, 'S34xxAlarm', {
      alarmName: `LanguagePeer-S3-4xx-${props.environment}`,
      alarmDescription: 'High rate of 4xx errors in S3',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: props.audioBucketName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    s34xxAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );
  }

  private createLambdaMetricsAndAlarms(props: MonitoringStackProps) {
    // Lambda error rate alarm (applies to all Lambda functions)
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `LanguagePeer-Lambda-Errors-${props.environment}`,
      alarmDescription: 'High error rate across Lambda functions',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );

    // Lambda duration alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `LanguagePeer-Lambda-Duration-${props.environment}`,
      alarmDescription: 'High duration across Lambda functions',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );
  }

  private createCustomMetricsAndAlarms(props: MonitoringStackProps) {
    // Custom metric for conversation success rate
    const conversationSuccessAlarm = new cloudwatch.Alarm(this, 'ConversationSuccessAlarm', {
      alarmName: `LanguagePeer-Conversation-Success-${props.environment}`,
      alarmDescription: 'Low conversation success rate',
      metric: new cloudwatch.Metric({
        namespace: 'LanguagePeer/Conversations',
        metricName: 'SuccessRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(15)
      }),
      threshold: 0.8, // 80% success rate
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    conversationSuccessAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );

    // Custom metric for voice processing latency
    const voiceLatencyAlarm = new cloudwatch.Alarm(this, 'VoiceLatencyAlarm', {
      alarmName: `LanguagePeer-Voice-Latency-${props.environment}`,
      alarmDescription: 'High voice processing latency',
      metric: new cloudwatch.Metric({
        namespace: 'LanguagePeer/Voice',
        metricName: 'ProcessingLatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    voiceLatencyAlarm.addAlarmAction(
      new cloudwatch.SnsAction(this.alertTopic)
    );
  }

  private createDashboardWidgets(props: MonitoringStackProps) {
    // API Gateway metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: props.apiGatewayId ? {
              ApiName: `LanguagePeer-API-${props.environment}`
            } : {},
            statistic: 'Sum'
          })
        ],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: props.apiGatewayId ? {
              ApiName: `LanguagePeer-API-${props.environment}`
            } : {},
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: props.apiGatewayId ? {
              ApiName: `LanguagePeer-API-${props.environment}`
            } : {},
            statistic: 'Sum'
          })
        ],
        width: 12
      })
    );

    // DynamoDB metrics
    if (props.userTableName || props.sessionTableName) {
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'DynamoDB Read/Write Capacity',
          left: [
            ...(props.userTableName ? [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: { TableName: props.userTableName },
                statistic: 'Sum'
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: { TableName: props.userTableName },
                statistic: 'Sum'
              })
            ] : []),
            ...(props.sessionTableName ? [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: { TableName: props.sessionTableName },
                statistic: 'Sum'
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: { TableName: props.sessionTableName },
                statistic: 'Sum'
              })
            ] : [])
          ],
          width: 12
        })
      );
    }

    // Lambda metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations and Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum'
          })
        ],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            statistic: 'Average'
          })
        ],
        width: 12
      })
    );

    // Custom application metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Conversation Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Conversations',
            metricName: 'Started',
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Conversations',
            metricName: 'Completed',
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Conversations',
            metricName: 'SuccessRate',
            statistic: 'Average'
          })
        ],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Voice Processing Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Voice',
            metricName: 'TranscriptionRequests',
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Voice',
            metricName: 'SynthesisRequests',
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'LanguagePeer/Voice',
            metricName: 'ProcessingLatency',
            statistic: 'Average'
          })
        ],
        width: 12
      })
    );
  }

  private createLogInsightsQueries() {
    // Create saved queries for common log analysis
    new logs.QueryDefinition(this, 'ErrorLogsQuery', {
      queryDefinitionName: `LanguagePeer-Errors-${this.stackName}`,
      queryString: `
        fields @timestamp, @message, @logStream
        | filter @message like /ERROR/
        | sort @timestamp desc
        | limit 100
      `,
      logGroups: [this.logGroup]
    });

    new logs.QueryDefinition(this, 'PerformanceQuery', {
      queryDefinitionName: `LanguagePeer-Performance-${this.stackName}`,
      queryString: `
        fields @timestamp, @duration, @requestId
        | filter @type = "REPORT"
        | stats avg(@duration), max(@duration), min(@duration) by bin(5m)
      `,
      logGroups: [this.logGroup]
    });

    new logs.QueryDefinition(this, 'ConversationAnalysisQuery', {
      queryDefinitionName: `LanguagePeer-Conversations-${this.stackName}`,
      queryString: `
        fields @timestamp, @message
        | filter @message like /conversation/
        | stats count() by bin(1h)
        | sort @timestamp desc
      `,
      logGroups: [this.logGroup]
    });
  }

  private createEventBridgeRules(props: MonitoringStackProps) {
    // EventBridge rule for automated responses to critical alerts
    const criticalAlertRule = new events.Rule(this, 'CriticalAlertRule', {
      ruleName: `LanguagePeer-CriticalAlerts-${props.environment}`,
      description: 'Automated response to critical system alerts',
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          state: {
            value: ['ALARM']
          },
          alarmName: [{
            prefix: `LanguagePeer-`
          }]
        }
      }
    });

    // Lambda function for automated alert handling
    const alertHandlerFunction = new lambda.Function(this, 'AlertHandler', {
      functionName: `LanguagePeer-AlertHandler-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Alert event:', JSON.stringify(event, null, 2));
          
          const alarmName = event.detail.alarmName;
          const state = event.detail.state.value;
          const reason = event.detail.state.reason;
          
          // Send enhanced notification
          const message = {
            alarmName,
            state,
            reason,
            timestamp: new Date().toISOString(),
            environment: '${props.environment}',
            dashboardUrl: 'https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=LanguagePeer-${props.environment}'
          };
          
          await sns.publish({
            TopicArn: '${this.alertTopic.topicArn}',
            Subject: \`🚨 LanguagePeer Alert: \${alarmName}\`,
            Message: JSON.stringify(message, null, 2)
          }).promise();
          
          return { statusCode: 200 };
        };
      `),
      timeout: cdk.Duration.minutes(1),
      environment: {
        ALERT_TOPIC_ARN: this.alertTopic.topicArn,
        ENVIRONMENT: props.environment
      }
    });

    // Grant permissions to the alert handler
    this.alertTopic.grantPublish(alertHandlerFunction);

    // Add the Lambda function as a target for the EventBridge rule
    criticalAlertRule.addTarget(
      new eventsTargets.LambdaFunction(alertHandlerFunction)
    );
  }
}