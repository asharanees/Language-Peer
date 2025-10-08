// Test setup for LanguagePeer application

// Mock AWS SDK modules globally
jest.mock('@aws-sdk/client-kinesis');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-transcribe');
jest.mock('@aws-sdk/client-polly');
jest.mock('@aws-sdk/client-comprehend');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Global test utilities - console available for debugging

// Setup fake timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});