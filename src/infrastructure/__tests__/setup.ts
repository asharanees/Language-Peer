// CDK test setup for LanguagePeer infrastructure tests

// Set required environment variables for CDK tests
process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
process.env.CDK_DEFAULT_REGION = 'us-east-1';
process.env.AWS_REGION = 'us-east-1';

// Mock AWS SDK calls during CDK synthesis
jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Account: '123456789012'
    })
  })),
  GetCallerIdentityCommand: jest.fn()
}));

// Suppress CDK CLI output during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Clean up CDK app context between tests
afterEach(() => {
  // Clear any CDK context that might interfere with tests
  delete process.env.CDK_CONTEXT_JSON;
});