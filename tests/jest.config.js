module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.test.js',
    '<rootDir>/**/*.test.ts',
    '<rootDir>/**/*.test.tsx',
    '<rootDir>/**/*.spec.js',
    '<rootDir>/**/*.spec.ts',
    '<rootDir>/**/*.spec.tsx'
  ],
  
  // Coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    '../server/**/*.js',
    '../client/**/*.{js,ts,tsx}',
    '../shared/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/test-*.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../client/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@server/(.*)$': '<rootDir>/../server/$1'
  },
  
  // File extensions
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Root directory for tests
  rootDir: __dirname,
  
  // Project root
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/integration/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/e2e/**/*.test.js'],
      testEnvironment: 'node'
    }
  ]
};
