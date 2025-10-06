// Jest test setup for LanguagePeer

// Mock AWS SDK clients for testing
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-transcribe');
jest.mock('@aws-sdk/client-polly');
jest.mock('@aws-sdk/client-comprehend');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-kinesis');

// Set test environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.ENVIRONMENT = 'test';
process.env.USER_TABLE_NAME = 'LanguagePeer-Users-test';
process.env.SESSION_TABLE_NAME = 'LanguagePeer-Sessions-test';
process.env.AUDIO_BUCKET_NAME = 'languagepeer-audio-test';
process.env.ANALYTICS_STREAM_NAME = 'LanguagePeer-Analytics-test';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});