module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/infrastructure'],
  testMatch: [
    '**/infrastructure/**/__tests__/**/*.ts',
    '**/infrastructure/**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/infrastructure/**/*.ts',
    '!src/infrastructure/**/*.d.ts',
    '!src/infrastructure/**/index.ts',
    '!src/infrastructure/__tests__/**/*.ts'
  ],
  coverageDirectory: 'coverage/infrastructure',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1'
  },
  testTimeout: 30000,
  verbose: true,
  // CDK-specific test setup
  setupFilesAfterEnv: ['<rootDir>/src/infrastructure/__tests__/setup.ts']
};