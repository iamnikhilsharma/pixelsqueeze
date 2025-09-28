module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/client/__tests__/setup.js'],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/client/components/$1',
    '^@/pages/(.*)$': '<rootDir>/client/pages/$1',
    '^@/store/(.*)$': '<rootDir>/client/store/$1',
    '^@/utils/(.*)$': '<rootDir>/client/utils/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/client/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/client/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/server/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/server/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'client/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,jsx,ts,tsx}',
    '!client/**/*.d.ts',
    '!client/pages/_app.tsx',
    '!client/pages/_document.tsx',
    '!client/next-env.d.ts',
    '!server/node_modules/**',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/client/node_modules/',
    '<rootDir>/client/__tests__/setup.js',
    '<rootDir>/server/__tests__/setup.js',
    '<rootDir>/server/__tests__/teardown.js',
  ],
  
  // Global setup
  globalSetup: '<rootDir>/server/__tests__/setup.js',
  globalTeardown: '<rootDir>/server/__tests__/teardown.js',
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
};
