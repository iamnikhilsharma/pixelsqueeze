# PixelSqueeze Testing Guide

This directory contains comprehensive automated tests for the PixelSqueeze application.

## 🏗️ **Test Structure**

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API endpoints
├── e2e/           # End-to-end tests for complete workflows
├── utils/          # Test utilities and helpers
├── jest.config.js  # Jest configuration
├── jest.setup.js   # Test setup and global configuration
├── jest.env.js     # Test environment variables
└── README.md       # This file
```

## 🚀 **Running Tests**

### **All Tests**
```bash
npm test
```

### **Watch Mode (Development)**
```bash
npm run test:watch
```

### **With Coverage Report**
```bash
npm run test:coverage
```

### **Specific Test Types**
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### **Continuous Integration**
```bash
npm run test:ci
```

## 📋 **Test Categories**

### **Unit Tests** (`tests/unit/`)
- **pricing.test.js** - Shared pricing configuration functions
- Individual component logic
- Utility functions
- Business logic validation

### **Integration Tests** (`tests/integration/`)
- **api.test.js** - Backend API endpoint testing
- Database interactions
- External service integrations
- Authentication flows

### **E2E Tests** (`tests/e2e/`)
- **payment-flow.test.js** - Complete payment journey
- User workflows
- Cross-component interactions
- Real-world scenarios

## 🛠️ **Test Utilities**

### **Global Test Utils** (`jest.setup.js`)
- `testUtils.generateTestToken()` - Generate JWT tokens
- `testUtils.createTestUser()` - Create test user data
- `testUtils.createTestPlan()` - Create test plan data
- `testUtils.mockRazorpayResponse()` - Mock payment responses

### **Helper Functions** (`tests/utils/test-helpers.js`)
- `authHelpers` - Authentication utilities
- `requestHelpers` - HTTP request helpers
- `validationHelpers` - Response validation
- `mockHelpers` - Mock object creation

## 🔧 **Configuration**

### **Jest Configuration** (`jest.config.js`)
- Test environment setup
- Coverage thresholds (70% minimum)
- Module path mapping
- Project organization

### **Environment Variables** (`jest.env.js`)
- Test database configuration
- Mock API keys
- Disabled logging
- Test-specific ports

## 📊 **Coverage Requirements**

The test suite enforces minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🧪 **Writing New Tests**

### **Unit Test Example**
```javascript
const pricing = require('../../shared/pricing.js');

describe('Pricing Functions', () => {
  test('should calculate savings correctly', () => {
    const savings = pricing.calculateSavings('starter', true);
    expect(savings).toBe(17);
  });
});
```

### **Integration Test Example**
```javascript
const request = require('supertest');
const app = require('../../server/index');

describe('API Endpoints', () => {
  test('should create order successfully', async () => {
    const response = await request(app)
      .post('/api/razorpay/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### **E2E Test Example**
```javascript
describe('Complete Payment Flow', () => {
  test('should complete full payment journey', async () => {
    // Step 1: Create order
    // Step 2: Process payment
    // Step 3: Update subscription
    // Step 4: Generate invoice
    // Step 5: Verify status
  });
});
```

## 🐛 **Debugging Tests**

### **Verbose Output**
```bash
npm test -- --verbose
```

### **Single Test File**
```bash
npm test -- tests/unit/pricing.test.js
```

### **Single Test**
```bash
npm test -- --testNamePattern="should calculate savings"
```

### **Debug Mode**
```bash
npm test -- --detectOpenHandles --forceExit
```

## 📝 **Best Practices**

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Services**: Don't rely on external APIs in tests
4. **Clean State**: Reset mocks and state between tests
5. **Meaningful Assertions**: Test specific outcomes, not implementation details
6. **Error Scenarios**: Include tests for failure cases and edge conditions

## 🔍 **Common Issues**

### **Port Conflicts**
- Tests use port 5003 to avoid conflicts with development server
- Ensure no other services are using test ports

### **Database Connections**
- Tests use separate test database (`pixelsqueeze_test`)
- MongoDB connection errors are expected in test environment

### **File Paths**
- All test files use relative paths from the `tests/` directory
- Use `../../` to reference parent directories

## 📈 **Continuous Integration**

The test suite is designed to run in CI/CD pipelines:
- `npm run test:ci` provides CI-optimized output
- Coverage reports are generated in multiple formats
- Tests run without watch mode for automation

## 🎯 **Test Goals**

1. **Reliability**: Tests should be deterministic and repeatable
2. **Coverage**: Maintain high code coverage across all components
3. **Performance**: Tests should run quickly and efficiently
4. **Maintainability**: Tests should be easy to understand and modify
5. **Documentation**: Tests serve as living documentation of expected behavior
