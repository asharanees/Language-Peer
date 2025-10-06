module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.integration.ts',
    '**/?(*.)+(integration).test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage/integration',
  setupFilesAfterEnv: ['<rootDir>/src/shared/test-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 60000, // Longer timeout for AWS service calls
  verbose: true,
  // Only run integration tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.unit\\.',
    '\\.spec\\.'
  ]
};