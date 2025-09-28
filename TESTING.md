# Testing Guide for PixelSqueeze

This document provides a comprehensive guide for testing the PixelSqueeze application.

## Testing Setup

The project uses Jest as the primary testing framework with the following configuration:

- **Client-side**: React Testing Library + Jest DOM
- **Server-side**: Supertest + Jest
- **Database**: MongoDB Memory Server for isolated tests
- **Coverage**: 70% threshold for all metrics

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

## Test Structure

```
├── client/
│   ├── __tests__/
│   │   └── setup.js              # Client test setup
│   ├── components/
│   │   └── __tests__/
│   │       ├── Button.test.js    # Component tests
│   │       └── Skeleton.test.js   # Component tests
│   └── pages/
│       └── __tests__/            # Page tests
├── server/
│   ├── __tests__/
│   │   ├── setup.js              # Server test setup
│   │   └── teardown.js           # Server test cleanup
│   ├── middleware/
│   │   └── __tests__/
│   │       └── rateLimiter.test.js # Middleware tests
│   └── routes/
│       └── __tests__/            # API route tests
├── jest.config.js                # Jest configuration
└── babel.config.js               # Babel configuration
```

## Writing Tests

### Component Tests

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### API Route Tests

```javascript
const request = require('supertest');
const app = require('../../app'); // Your Express app

describe('API Routes', () => {
  it('should return 200 for valid request', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 for invalid request', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ invalid: 'data' })
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
  });
});
```

### Database Tests

```javascript
const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const user = new User(userData);
    await user.save();

    expect(user.email).toBe(userData.email);
    expect(user._id).toBeDefined();
  });
});
```

## Test Categories

### Unit Tests
- Test individual components in isolation
- Test utility functions
- Test model methods
- Test middleware functions

### Integration Tests
- Test API endpoints with database
- Test component interactions
- Test authentication flows
- Test rate limiting

### End-to-End Tests
- Test complete user workflows
- Test cross-page navigation
- Test file upload and processing
- Test payment flows

## Mocking

### Common Mocks

```javascript
// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;
```

## Coverage Requirements

The project maintains a minimum coverage threshold of 70% for:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies**: Mock API calls, localStorage, and other external services
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Keep Tests Simple**: Each test should verify one specific behavior
6. **Use Data Attributes**: Add `data-testid` attributes for reliable element selection

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Code push to main branch
- Scheduled nightly runs

The CI pipeline will fail if:
- Any tests fail
- Coverage drops below threshold
- Linting errors are present

## Debugging Tests

```bash
# Run specific test file
npm test Button.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run tests with verbose output
npm test -- --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Testing

For performance testing, consider:
- Load testing with Artillery or k6
- Memory leak detection
- Database query performance
- Image processing benchmarks

## Security Testing

Include tests for:
- Input validation
- Authentication bypass attempts
- Rate limiting effectiveness
- SQL injection prevention
- XSS protection
