module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/infrastructure/**/*.ts' // Exclude CDK infrastructure from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/shared/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@/backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@/frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1'
  },
  testTimeout: 30000,
  verbose: true
};