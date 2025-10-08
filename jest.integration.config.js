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
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@/backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@/frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1'
  },
  testTimeout: 60000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/infrastructure/**/*.ts'
  ]
};