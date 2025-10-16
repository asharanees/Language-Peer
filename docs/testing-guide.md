# LanguagePeer Testing Guide

## Testing Strategy Overview

LanguagePeer uses a comprehensive testing strategy with multiple layers:

1. **Unit Tests**: Individual component and service testing
2. **Integration Tests**: Cross-service and AWS integration testing
3. **End-to-End Tests**: Complete user journey testing
4. **Offline Mode Tests**: Enhanced offline functionality validation
5. **Infrastructure Tests**: CDK stack and deployment validation
6. **Performance Tests**: Load and stress testing
7. **Security Tests**: Vulnerability and compliance testing

## Test Environment Setup

### Prerequisites
```bash
# Install test dependencies
npm install

# Install Playwright for E2E tests
npx playwright install

# Set up test environment variables
export TEST_ENVIRONMENT=development
export AWS_REGION=us-east-1
export DEMO_BASE_URL="https://your-demo-url.cloudfront.net"
export DEMO_API_URL="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"
```

## Running Tests

### 1. Unit Tests

#### Frontend Tests
```bash
# Run all frontend unit tests
cd src/frontend && npm test

# Run specific test files
npm test -- VoiceRecorder.test.tsx
npm test -- useVoiceRecording.test.ts

# Run tests with coverage
npm test -- --coverage
```

#### Backend Tests
```bash
# Run all backend unit tests
npm run test:backend

# Run specific service tests
npm test -- conversation-orchestrator.test.ts
npm test -- bedrock-client.test.ts

# Run with verbose output
npm test -- --verbose
```

#### Infrastructure Tests
```bash
# Run CDK stack tests
npm run test:infrastructure

# Run specific stack tests
npm test -- language-peer-stack.test.ts
npm test -- monitoring-stack.test.ts
```

### 2. Integration Tests

#### AWS Service Integration
```bash
# Run full system integration tests
npm run test:integration

# Run with specific environment
TEST_ENVIRONMENT=staging npm run test:integration

# Run specific integration test suites
npm test tests/integration/full-system.test.ts
```

#### API Integration Tests

##### CloudFront API Test Tool
A simple HTML test tool is available at the project root (`test-cloudfront.html`) for interactive CloudFront distribution testing:

**Features:**
- Interactive button to test POST requests to the conversation endpoint
- Real-time display of API responses and errors  
- Pre-configured test payload with sample conversation data
- Direct testing through the CloudFront CDN distribution

**Usage:**
1. Open `test-cloudfront.html` in any web browser
2. Click "Test POST Request" to send a test conversation message
3. View the response status and data in the results section

**Test Payload:**
```json
{
  "message": "Hello test",
  "agentPersonality": "friendly-tutor", 
  "userId": "test-user"
}
```

##### Command Line Testing
```bash
# Test API endpoints via CloudFront
curl -X POST https://dohpefdcwoh2h.cloudfront.net/development/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello test", "agentPersonality": "friendly-tutor", "userId": "test-user"}'

# Test demo endpoints
curl -X GET "$DEMO_API_URL/demo/health"
curl -X GET "$DEMO_API_URL/demo/users"
curl -X GET "$DEMO_API_URL/demo/sessions"

# Test with authentication (if implemented)
curl -X GET "$API_ENDPOINT/api/users/me" -H "Authorization: Bearer $JWT_TOKEN"
```

### 3. End-to-End Tests

#### Browser Tests with Playwright
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test files
npx playwright test demo-environment.test.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### Mobile Testing
```bash
# Test mobile viewports
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### 4. Performance Tests

#### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests on API endpoints
artillery run tests/performance/api-load-test.yml

# Test demo website performance
artillery run tests/performance/website-load-test.yml
```

#### Lighthouse Performance Testing
```bash
# Install lighthouse
npm install -g lighthouse

# Test demo website performance
lighthouse $DEMO_BASE_URL --output html --output-path ./reports/lighthouse-report.html

# Test with mobile simulation
lighthouse $DEMO_BASE_URL --preset=mobile --output html --output-path ./reports/lighthouse-mobile.html
```

## Test Categories and Coverage

### 1. Frontend Component Tests

#### Voice Interface Components
- **VoiceRecorder**: Audio recording functionality
- **AudioPlayer**: Audio playback controls
- **AudioVisualizer**: Real-time audio visualization
- **TranscriptDisplay**: Speech-to-text display

#### Conversation Components
- **ConversationInterface**: Main chat interface
- **AgentSelector**: AI agent selection
- **FeedbackPanel**: Learning feedback display

#### Common Components
- **Button**: Reusable button component
- **Toast**: Notification system
- **LoadingSpinner**: Loading states
- **ErrorBoundary**: Error handling

### 2. Backend Service Tests

#### Core Services
- **ConversationOrchestrator**: Conversation flow management
- **BedrockClient**: AWS Bedrock integration
- **RecommendationEngine**: Learning recommendations

#### Voice Processing
- **TranscribeService**: Speech-to-text processing
- **PollyService**: Text-to-speech synthesis with event-driven completion
- **S3AudioService**: Audio file management
- **TTS Event Handling**: Browser-based speech synthesis with proper completion detection

#### Data Services
- **UserProfileService**: User data management
- **SessionManagementService**: Conversation sessions
- **ProgressAnalyticsService**: Learning analytics

#### AI Agent Services
- **MultiAgentCoordination**: Agent switching logic
- **EngagementDetection**: User engagement analysis
- **IntelligentFeedbackTiming**: Feedback optimization

### 3. Enhanced Offline Mode Tests

#### Offline Functionality Testing
```bash
# Test offline mode functionality
npm run test:offline

# Test specific offline features
npm test -- ConversationInterface.test.tsx --testNamePattern="offline"
npm test -- generateEnhancedOfflineResponse
npm test -- generateMockFeedback
```

#### Offline Mode Test Cases
- **Context-Aware Responses**: Verify responses adapt to conversation topics
- **Personality Preservation**: Ensure agent personalities remain distinct offline
- **Realistic Feedback**: Validate dynamic scoring and suggestions
- **Seamless Transitions**: Test online/offline mode switching
- **Local Storage**: Verify conversation persistence

#### Manual Offline Testing
```bash
# Simulate offline mode
# 1. Start the application
npm run dev

# 2. Open browser developer tools
# 3. Go to Network tab
# 4. Check "Offline" to simulate network failure
# 5. Test conversation functionality

# Expected behavior:
# - Conversations continue working
# - Agent responses are contextual and realistic
# - Feedback scores are generated dynamically
# - No error messages or broken functionality
```

### 4. Infrastructure Tests

#### CDK Stack Tests
- **LanguagePeerStack**: Core infrastructure
- **VoiceProcessingStack**: Voice services
- **AgentStack**: AI agent infrastructure
- **MonitoringStack**: Observability setup
- **DemoStack**: Demo environment

#### Deployment Tests
- **DeploymentPipeline**: CI/CD pipeline validation
- **EnvironmentValidation**: Configuration testing
- **DeploymentIntegration**: Cross-stack dependencies

### 4. Integration Test Scenarios

#### User Journey Tests
```typescript
// Example test scenario
test('complete conversation flow', async () => {
  // 1. User registration/login
  // 2. Agent selection
  // 3. Voice recording
  // 4. Speech processing
  // 5. AI response generation
  // 6. Feedback delivery
  // 7. Progress tracking
});
```

#### AWS Service Integration
- DynamoDB read/write operations
- S3 audio file upload/download
- Lambda function invocations
- API Gateway request routing
- CloudWatch metrics publishing

### 5. Security Tests

#### Authentication Tests
```bash
# Test JWT token validation
curl -X GET "$API_ENDPOINT/api/protected" -H "Authorization: Bearer invalid_token"

# Test CORS configuration
curl -X OPTIONS "$API_ENDPOINT/api/users" -H "Origin: http://malicious-site.com"
```

#### Input Validation Tests
```bash
# Test SQL injection protection
curl -X POST "$API_ENDPOINT/api/users" -d '{"name": "'; DROP TABLE users; --"}'

# Test XSS protection
curl -X POST "$API_ENDPOINT/api/conversations" -d '{"message": "<script>alert(\"xss\")</script>"}'
```

## Test Data Management

### Test Data Setup
```bash
# Seed test data for development
npm run seed:test-data

# Clean up test data
npm run cleanup:test-data
```

### Mock Data Services
```typescript
// Example mock service
export const mockUserService = {
  getUser: jest.fn().mockResolvedValue({
    id: 'test-user-1',
    name: 'Test User',
    targetLanguage: 'Spanish'
  }),
  createUser: jest.fn().mockResolvedValue({ success: true })
};
```

## Continuous Integration Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DEMO_BASE_URL: ${{ secrets.DEMO_BASE_URL }}
```

## Test Reporting and Coverage

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results
```bash
# Generate JUnit XML reports
npm test -- --reporters=jest-junit

# Generate HTML test reports
npm test -- --reporters=jest-html-reporters
```

## Debugging Tests

### Debug Unit Tests
```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run specific test with debugging
npm test -- --testNamePattern="should handle voice recording" --inspect-brk
```

### Debug E2E Tests
```bash
# Run Playwright tests with debugging
npx playwright test --debug

# Run with browser developer tools
npx playwright test --headed --slowMo=1000
```

### Debug Integration Tests
```bash
# Enable AWS SDK debugging
export AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
export DEBUG=aws-sdk:*

npm run test:integration
```

## Performance Testing

### API Performance Tests
```yaml
# tests/performance/api-load-test.yml
config:
  target: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20

scenarios:
  - name: "Health Check Load Test"
    requests:
      - get:
          url: "/prod/demo/health"
  
  - name: "Demo Data Load Test"
    requests:
      - get:
          url: "/prod/demo/users"
      - get:
          url: "/prod/demo/sessions"
```

### Frontend Performance Tests
```bash
# Bundle size analysis
npm run analyze

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

## Test Environment Cleanup

### Cleanup Scripts
```bash
# Clean up test resources
npm run cleanup:test-env

# Remove test data from DynamoDB
aws dynamodb scan --table-name LanguagePeer-Users-development \
  --filter-expression "begins_with(userId, :prefix)" \
  --expression-attribute-values '{":prefix":{"S":"test-"}}' \
  --query 'Items[].userId.S' --output text | \
  xargs -I {} aws dynamodb delete-item --table-name LanguagePeer-Users-development \
  --key '{"userId":{"S":"{}"}}'
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Mock Strategy
- Mock external dependencies
- Use real AWS services for integration tests
- Provide realistic test data
- Clean up resources after tests

### Performance Considerations
- Run expensive tests in CI only
- Use test timeouts appropriately
- Parallelize test execution where possible
- Cache test dependencies

### Security Testing
- Test authentication and authorization
- Validate input sanitization
- Check for common vulnerabilities
- Test rate limiting and throttling

---

**Next Steps**: After running tests successfully, monitor the application using the CloudWatch dashboards and alerts configured in the monitoring stack.