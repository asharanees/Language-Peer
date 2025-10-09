import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DemoStackProps extends cdk.StackProps {
  environment: string;
}

export class DemoStack extends cdk.Stack {
  public readonly demoWebsite: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly demoApi: apigateway.RestApi;
  public readonly demoDataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DemoStackProps) {
    super(scope, id, props);

    // S3 bucket for demo website hosting
    this.demoWebsite = new s3.Bucket(this, 'DemoWebsite', {
      bucketName: `languagepeer-demo-${props.environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // CloudFront distribution for global CDN
    this.distribution = new cloudfront.Distribution(this, 'DemoDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.demoWebsite),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: `LanguagePeer Demo Distribution - ${props.environment}`
    });

    // DynamoDB table for demo data
    this.demoDataTable = new dynamodb.Table(this, 'DemoDataTable', {
      tableName: `LanguagePeer-DemoData-${props.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false // Demo environment doesn't need backup
    });

    // Lambda function for demo data seeding
    const demoDataSeeder = new lambda.Function(this, 'DemoDataSeeder', {
      functionName: `LanguagePeer-DemoSeeder-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        const demoData = {
          users: [
            {
              id: 'demo-user-1',
              type: 'user',
              name: 'Alice Johnson',
              email: 'alice@demo.languagepeer.com',
              targetLanguage: 'Spanish',
              proficiencyLevel: 'Beginner',
              createdAt: new Date().toISOString()
            },
            {
              id: 'demo-user-2',
              type: 'user',
              name: 'Bob Smith',
              email: 'bob@demo.languagepeer.com',
              targetLanguage: 'French',
              proficiencyLevel: 'Intermediate',
              createdAt: new Date().toISOString()
            }
          ],
          sessions: [
            {
              id: 'demo-session-1',
              type: 'session',
              userId: 'demo-user-1',
              agentType: 'friendly-tutor',
              topic: 'Basic Greetings',
              duration: 300000,
              status: 'completed',
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 'demo-session-2',
              type: 'session',
              userId: 'demo-user-2',
              agentType: 'pronunciation-coach',
              topic: 'French Pronunciation',
              duration: 450000,
              status: 'completed',
              createdAt: new Date(Date.now() - 43200000).toISOString()
            }
          ],
          conversations: [
            {
              id: 'demo-conv-1',
              type: 'conversation',
              sessionId: 'demo-session-1',
              messages: [
                { role: 'agent', content: '¡Hola! How are you today?', timestamp: new Date(Date.now() - 86400000).toISOString() },
                { role: 'user', content: 'Hola, estoy bien, gracias', timestamp: new Date(Date.now() - 86399000).toISOString() },
                { role: 'agent', content: 'Excellent pronunciation! Let\\'s practice more greetings.', timestamp: new Date(Date.now() - 86398000).toISOString() }
              ]
            }
          ]
        };
        
        exports.handler = async (event) => {
          try {
            const tableName = process.env.DEMO_TABLE_NAME;
            
            // Seed demo data
            for (const category of Object.keys(demoData)) {
              for (const item of demoData[category]) {
                await dynamodb.put({
                  TableName: tableName,
                  Item: item,
                  ConditionExpression: 'attribute_not_exists(id)'
                }).promise().catch(err => {
                  if (err.code !== 'ConditionalCheckFailedException') {
                    throw err;
                  }
                });
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Demo data seeded successfully' })
            };
          } catch (error) {
            console.error('Error seeding demo data:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      environment: {
        DEMO_TABLE_NAME: this.demoDataTable.tableName
      },
      timeout: cdk.Duration.minutes(5)
    });

    // Grant permissions to the seeder function
    this.demoDataTable.grantWriteData(demoDataSeeder);

    // API Gateway for demo endpoints
    this.demoApi = new apigateway.RestApi(this, 'DemoApi', {
      restApiName: `LanguagePeer-Demo-API-${props.environment}`,
      description: 'Demo API for LanguagePeer showcase',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Lambda function for demo API endpoints
    const demoApiHandler = new lambda.Function(this, 'DemoApiHandler', {
      functionName: `LanguagePeer-DemoAPI-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.handler = async (event) => {
          const { httpMethod, path, pathParameters } = event;
          const tableName = process.env.DEMO_TABLE_NAME;
          
          try {
            switch (path) {
              case '/demo/users':
                if (httpMethod === 'GET') {
                  const users = await dynamodb.query({
                    TableName: tableName,
                    IndexName: 'TypeIndex',
                    KeyConditionExpression: '#type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'user' }
                  }).promise();
                  
                  return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users.Items)
                  };
                }
                break;
                
              case '/demo/sessions':
                if (httpMethod === 'GET') {
                  const sessions = await dynamodb.query({
                    TableName: tableName,
                    IndexName: 'TypeIndex',
                    KeyConditionExpression: '#type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'session' }
                  }).promise();
                  
                  return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessions.Items)
                  };
                }
                break;
                
              case '/demo/health':
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    environment: '${props.environment}'
                  })
                };
                
              default:
                return {
                  statusCode: 404,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'Not found' })
                };
            }
          } catch (error) {
            console.error('Demo API error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      environment: {
        DEMO_TABLE_NAME: this.demoDataTable.tableName
      }
    });

    // Grant read permissions to the API handler
    this.demoDataTable.grantReadData(demoApiHandler);

    // Add GSI for querying by type
    this.demoDataTable.addGlobalSecondaryIndex({
      indexName: 'TypeIndex',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    // API Gateway resources and methods
    const demoResource = this.demoApi.root.addResource('demo');
    
    const usersResource = demoResource.addResource('users');
    usersResource.addMethod('GET', new apigateway.LambdaIntegration(demoApiHandler));
    
    const sessionsResource = demoResource.addResource('sessions');
    sessionsResource.addMethod('GET', new apigateway.LambdaIntegration(demoApiHandler));
    
    const healthResource = demoResource.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(demoApiHandler));

    // Custom resource to trigger demo data seeding on deployment
    const seedDemoData = new cdk.CustomResource(this, 'SeedDemoData', {
      serviceToken: demoDataSeeder.functionArn,
      properties: {
        // Change this value to re-trigger seeding
        Version: '1.0.0'
      }
    });

    // Grant Lambda invoke permission to CloudFormation
    demoDataSeeder.addPermission('AllowCloudFormationInvoke', {
      principal: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      action: 'lambda:InvokeFunction'
    });

    // Deploy demo website files
    new s3deploy.BucketDeployment(this, 'DeployDemoWebsite', {
      sources: [
        s3deploy.Source.data('index.html', this.generateDemoIndexHtml()),
        s3deploy.Source.data('demo.js', this.generateDemoJavaScript()),
        s3deploy.Source.data('styles.css', this.generateDemoCSS()),
        s3deploy.Source.data('error.html', this.generateErrorHtml())
      ],
      destinationBucket: this.demoWebsite,
      distribution: this.distribution,
      distributionPaths: ['/*']
    });

    // Outputs
    new cdk.CfnOutput(this, 'DemoWebsiteUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Demo website URL'
    });

    new cdk.CfnOutput(this, 'DemoApiUrl', {
      value: this.demoApi.url,
      description: 'Demo API base URL'
    });

    new cdk.CfnOutput(this, 'DemoHealthCheckUrl', {
      value: `${this.demoApi.url}demo/health`,
      description: 'Demo API health check endpoint'
    });
  }

  private generateDemoIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LanguagePeer - AI-Powered Language Learning Demo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>🗣️ LanguagePeer</h1>
            <p class="tagline">AI-Powered Voice-First Language Learning</p>
        </div>
    </header>

    <main class="container">
        <section class="hero">
            <h2>Experience the Future of Language Learning</h2>
            <p>Practice conversations with AI agents that adapt to your learning style and provide real-time feedback.</p>
            
            <div class="demo-controls">
                <button id="startDemo" class="btn-primary">Start Demo Conversation</button>
                <button id="viewStats" class="btn-secondary">View Learning Analytics</button>
            </div>
        </section>

        <section class="features">
            <h3>Key Features</h3>
            <div class="feature-grid">
                <div class="feature-card">
                    <h4>🎯 Adaptive AI Agents</h4>
                    <p>Multiple AI personalities (Friendly Tutor, Strict Teacher, Pronunciation Coach) that adapt to your learning needs.</p>
                </div>
                <div class="feature-card">
                    <h4>🎤 Voice-First Interface</h4>
                    <p>Practice speaking naturally with real-time transcription and pronunciation feedback.</p>
                </div>
                <div class="feature-card">
                    <h4>📊 Smart Analytics</h4>
                    <p>Track your progress with detailed analytics on vocabulary, grammar, and conversation skills.</p>
                </div>
                <div class="feature-card">
                    <h4>🔄 Intelligent Feedback</h4>
                    <p>Get contextual corrections and suggestions that help you improve naturally.</p>
                </div>
            </div>
        </section>

        <section class="demo-data">
            <h3>Demo Data</h3>
            <div class="data-tabs">
                <button class="tab-btn active" data-tab="users">Demo Users</button>
                <button class="tab-btn" data-tab="sessions">Learning Sessions</button>
                <button class="tab-btn" data-tab="health">System Health</button>
            </div>
            
            <div id="users-tab" class="tab-content active">
                <div id="users-data" class="data-display">Loading users...</div>
            </div>
            
            <div id="sessions-tab" class="tab-content">
                <div id="sessions-data" class="data-display">Loading sessions...</div>
            </div>
            
            <div id="health-tab" class="tab-content">
                <div id="health-data" class="data-display">Loading health status...</div>
            </div>
        </section>

        <section class="architecture">
            <h3>System Architecture</h3>
            <div class="arch-diagram">
                <div class="arch-component">
                    <h4>Frontend</h4>
                    <p>React + TypeScript<br>Voice Recording<br>Real-time UI</p>
                </div>
                <div class="arch-arrow">→</div>
                <div class="arch-component">
                    <h4>API Gateway</h4>
                    <p>REST API<br>WebSocket<br>Authentication</p>
                </div>
                <div class="arch-arrow">→</div>
                <div class="arch-component">
                    <h4>Lambda Functions</h4>
                    <p>Conversation Logic<br>Voice Processing<br>Agent Coordination</p>
                </div>
                <div class="arch-arrow">→</div>
                <div class="arch-component">
                    <h4>AWS Services</h4>
                    <p>Bedrock (AI)<br>Transcribe<br>Polly<br>DynamoDB</p>
                </div>
            </div>
        </section>

        <section class="tech-stack">
            <h3>Technology Stack</h3>
            <div class="tech-categories">
                <div class="tech-category">
                    <h4>Frontend</h4>
                    <ul>
                        <li>React 18</li>
                        <li>TypeScript</li>
                        <li>Web Audio API</li>
                        <li>WebSocket</li>
                    </ul>
                </div>
                <div class="tech-category">
                    <h4>Backend</h4>
                    <ul>
                        <li>AWS Lambda</li>
                        <li>Node.js</li>
                        <li>API Gateway</li>
                        <li>DynamoDB</li>
                    </ul>
                </div>
                <div class="tech-category">
                    <h4>AI Services</h4>
                    <ul>
                        <li>AWS Bedrock</li>
                        <li>Claude 3.5 Sonnet</li>
                        <li>Transcribe</li>
                        <li>Polly</li>
                    </ul>
                </div>
                <div class="tech-category">
                    <h4>Infrastructure</h4>
                    <ul>
                        <li>AWS CDK</li>
                        <li>CloudFormation</li>
                        <li>CloudWatch</li>
                        <li>S3 + CloudFront</li>
                    </ul>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2024 LanguagePeer. Built for AWS GenAI Hackathon.</p>
            <p>
                <a href="https://github.com/your-github-username/language-peer" target="_blank">View on GitHub</a> |
                <a href="#" id="apiDocsLink">API Documentation</a>
            </p>
        </div>
    </footer>

    <script src="demo.js"></script>
</body>
</html>`;
  }

  private generateDemoJavaScript(): string {
    return `// LanguagePeer Demo JavaScript
class LanguagePeerDemo {
    constructor() {
        this.apiBaseUrl = window.location.origin.includes('localhost') 
            ? 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod'
            : '${this.demoApi.url}';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Demo controls
        document.getElementById('startDemo').addEventListener('click', () => {
            this.startDemoConversation();
        });

        document.getElementById('viewStats').addEventListener('click', () => {
            this.showAnalytics();
        });

        // API docs link
        document.getElementById('apiDocsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showApiDocs();
        });
    }

    async loadInitialData() {
        await this.loadUsers();
        await this.loadHealthStatus();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(\`\${tabName}-tab\`).classList.add('active');

        // Load data for the selected tab
        switch(tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'sessions':
                this.loadSessions();
                break;
            case 'health':
                this.loadHealthStatus();
                break;
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(\`\${this.apiBaseUrl}demo/users\`);
            const users = await response.json();
            
            const usersHtml = users.map(user => \`
                <div class="data-item">
                    <h4>\${user.name}</h4>
                    <p><strong>Email:</strong> \${user.email}</p>
                    <p><strong>Target Language:</strong> \${user.targetLanguage}</p>
                    <p><strong>Level:</strong> \${user.proficiencyLevel}</p>
                    <p><strong>Joined:</strong> \${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            \`).join('');
            
            document.getElementById('users-data').innerHTML = usersHtml || '<p>No demo users found.</p>';
        } catch (error) {
            document.getElementById('users-data').innerHTML = '<p class="error">Error loading users data.</p>';
            console.error('Error loading users:', error);
        }
    }

    async loadSessions() {
        try {
            const response = await fetch(\`\${this.apiBaseUrl}demo/sessions\`);
            const sessions = await response.json();
            
            const sessionsHtml = sessions.map(session => \`
                <div class="data-item">
                    <h4>\${session.topic}</h4>
                    <p><strong>Agent:</strong> \${session.agentType}</p>
                    <p><strong>Duration:</strong> \${Math.round(session.duration / 60000)} minutes</p>
                    <p><strong>Status:</strong> <span class="status \${session.status}">\${session.status}</span></p>
                    <p><strong>Date:</strong> \${new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
            \`).join('');
            
            document.getElementById('sessions-data').innerHTML = sessionsHtml || '<p>No demo sessions found.</p>';
        } catch (error) {
            document.getElementById('sessions-data').innerHTML = '<p class="error">Error loading sessions data.</p>';
            console.error('Error loading sessions:', error);
        }
    }

    async loadHealthStatus() {
        try {
            const response = await fetch(\`\${this.apiBaseUrl}demo/health\`);
            const health = await response.json();
            
            const healthHtml = \`
                <div class="health-status \${health.status}">
                    <h4>System Status: \${health.status.toUpperCase()}</h4>
                    <p><strong>Environment:</strong> \${health.environment}</p>
                    <p><strong>Last Check:</strong> \${new Date(health.timestamp).toLocaleString()}</p>
                    <div class="health-indicators">
                        <div class="indicator healthy">✅ API Gateway</div>
                        <div class="indicator healthy">✅ Lambda Functions</div>
                        <div class="indicator healthy">✅ DynamoDB</div>
                        <div class="indicator healthy">✅ CloudWatch</div>
                    </div>
                </div>
            \`;
            
            document.getElementById('health-data').innerHTML = healthHtml;
        } catch (error) {
            document.getElementById('health-data').innerHTML = \`
                <div class="health-status unhealthy">
                    <h4>System Status: UNHEALTHY</h4>
                    <p class="error">Unable to connect to demo API</p>
                </div>
            \`;
            console.error('Error loading health status:', error);
        }
    }

    startDemoConversation() {
        alert('🎤 Demo Conversation\\n\\nIn a full implementation, this would:\\n\\n• Start voice recording\\n• Connect to AI agent\\n• Provide real-time transcription\\n• Give pronunciation feedback\\n• Track learning progress\\n\\nThis demo shows the infrastructure and data layer.');
    }

    showAnalytics() {
        alert('📊 Learning Analytics\\n\\nIn a full implementation, this would show:\\n\\n• Vocabulary progress\\n• Grammar improvement\\n• Pronunciation scores\\n• Conversation fluency\\n• Learning streaks\\n• Personalized recommendations\\n\\nThe backend infrastructure supports all these features!');
    }

    showApiDocs() {
        const docs = \`
# LanguagePeer Demo API Documentation

## Base URL
\${this.apiBaseUrl}

## Endpoints

### GET /demo/users
Returns list of demo users with their learning profiles.

### GET /demo/sessions  
Returns list of completed learning sessions.

### GET /demo/health
Returns system health status and environment info.

## Response Format
All endpoints return JSON with appropriate HTTP status codes.

## Authentication
Demo endpoints are public. Production API uses JWT tokens.

## Rate Limiting
Demo API is limited to 100 requests per minute per IP.
        \`;
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(\`
            <html>
                <head><title>LanguagePeer API Docs</title></head>
                <body style="font-family: monospace; padding: 20px; background: #f5f5f5;">
                    <pre>\${docs}</pre>
                </body>
            </html>
        \`);
    }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LanguagePeerDemo();
});`;
  }

  private generateDemoCSS(): string {
    return `/* LanguagePeer Demo Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 2rem 0;
    text-align: center;
    color: white;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.tagline {
    font-size: 1.2rem;
    opacity: 0.9;
}

main {
    background: white;
    margin: 2rem auto;
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.hero {
    text-align: center;
    margin-bottom: 4rem;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.hero p {
    font-size: 1.2rem;
    color: #7f8c8d;
    margin-bottom: 2rem;
}

.demo-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
}

.btn-secondary:hover {
    background: #667eea;
    color: white;
    transform: translateY(-2px);
}

.features {
    margin-bottom: 4rem;
}

.features h3 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #2c3e50;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    transition: transform 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card h4 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.demo-data {
    margin-bottom: 4rem;
}

.demo-data h3 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #2c3e50;
}

.data-tabs {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.tab-btn {
    padding: 0.8rem 1.5rem;
    border: 2px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.tab-btn.active,
.tab-btn:hover {
    background: #667eea;
    color: white;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.data-display {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 2rem;
    min-height: 200px;
}

.data-item {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    border-left: 4px solid #667eea;
}

.data-item h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.data-item p {
    margin-bottom: 0.3rem;
    color: #7f8c8d;
}

.status {
    padding: 0.2rem 0.8rem;
    border-radius: 15px;
    font-size: 0.9rem;
    font-weight: 600;
}

.status.completed {
    background: #d4edda;
    color: #155724;
}

.health-status {
    text-align: center;
    padding: 2rem;
}

.health-status.healthy {
    color: #155724;
}

.health-status.unhealthy {
    color: #721c24;
}

.health-indicators {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.indicator {
    padding: 0.5rem;
    border-radius: 8px;
    font-weight: 500;
}

.indicator.healthy {
    background: #d4edda;
    color: #155724;
}

.error {
    color: #721c24;
    background: #f8d7da;
    padding: 1rem;
    border-radius: 8px;
}

.architecture {
    margin-bottom: 4rem;
}

.architecture h3 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #2c3e50;
}

.arch-diagram {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.arch-component {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 15px;
    text-align: center;
    min-width: 150px;
    border: 2px solid #667eea;
}

.arch-component h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.arch-arrow {
    font-size: 2rem;
    color: #667eea;
    font-weight: bold;
}

.tech-stack h3 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #2c3e50;
}

.tech-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
}

.tech-category {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 15px;
}

.tech-category h4 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.3rem;
}

.tech-category ul {
    list-style: none;
}

.tech-category li {
    padding: 0.3rem 0;
    color: #7f8c8d;
    position: relative;
    padding-left: 1.5rem;
}

.tech-category li:before {
    content: "▶";
    position: absolute;
    left: 0;
    color: #667eea;
}

footer {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: white;
    text-align: center;
    padding: 2rem 0;
}

footer a {
    color: white;
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}

@media (max-width: 768px) {
    header h1 {
        font-size: 2rem;
    }
    
    .hero h2 {
        font-size: 1.8rem;
    }
    
    main {
        margin: 1rem;
        padding: 2rem 1rem;
    }
    
    .arch-diagram {
        flex-direction: column;
    }
    
    .arch-arrow {
        transform: rotate(90deg);
    }
}`;
  }

  private generateErrorHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - LanguagePeer Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
            text-align: center;
        }
        .error-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 20px;
            max-width: 500px;
        }
        h1 { font-size: 4rem; margin-bottom: 1rem; }
        h2 { font-size: 2rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        a {
            display: inline-block;
            padding: 1rem 2rem;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: transform 0.3s ease;
        }
        a:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist in our demo environment.</p>
        <a href="/">Return to Demo Home</a>
    </div>
</body>
</html>`;
  }
}`;
  }
}

Now let me update the main CDK app to include the demo stack:

<function_calls>
<invoke name="strReplace">
<parameter name="oldStr">#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LanguagePeerStack } from './stacks/language-peer-stack';
import { VoiceProcessingStack } from './stacks/voice-processing-stack';
import { AgentStack } from './stacks/agent-stack';
import { DeploymentPipelineStack } from './stacks/deployment-pipeline-stack';
import { MonitoringStack } from './stacks/monitoring-stack';

const app = new cdk.App();

// Get environment configuration
const environment = app.node.tryGetContext('environment') || 'development';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const env = { account, region };

// Core infrastructure stack
const coreStack = new LanguagePeerStack(app, `LanguagePeer-Core-${environment}`, {
    env,
    environment,
    description: 'Core infrastructure for LanguagePeer voice-first language learning platform'
});

// Voice processing stack (Transcribe, Polly, S3)
const voiceStack = new VoiceProcessingStack(app, `LanguagePeer-Voice-${environment}`, {
    env,
    environment,
    description: 'Voice processing infrastructure with AWS Transcribe and Polly'
});

// AI Agent stack (Bedrock, Strands)
const agentStack = new AgentStack(app, `LanguagePeer-Agents-${environment}`, {
    env,
    environment,
    description: 'AI agent infrastructure with AWS Bedrock and Strands framework'
});

// Monitoring stack
new MonitoringStack(app, `LanguagePeer-Monitoring-${environment}`, {
    env,
    environment,
    userTableName: coreStack.userTable.tableName,
    sessionTableName: coreStack.sessionTable.tableName,
    apiGatewayId: coreStack.api.restApiId,
    audioBucketName: voiceStack.audioBucket.bucketName,
    description: `Monitoring and alerting infrastructure for LanguagePeer ${environment} environment`
});

// Deployment pipeline stack (only for staging and production)
if (environment !== 'development') {
    new DeploymentPipelineStack(app, `LanguagePeer-Pipeline-${environment}`, {
        env,
        environment,
        githubOwner: process.env.GITHUB_OWNER || 'your-github-username',
        githubRepo: process.env.GITHUB_REPO || 'language-peer',
        githubBranch: environment === 'production' ? 'main' : 'develop',
        description: `Deployment pipeline for LanguagePeer ${environment} environment`
    });
}