const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { generalRateLimit, authRateLimiter } = require('../../middleware/rateLimiter');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(generalRateLimit);
  
  // Test routes
  app.get('/test', (req, res) => {
    res.json({ message: 'Test successful' });
  });
  
  app.post('/auth/test', authRateLimiter, (req, res) => {
    res.json({ message: 'Auth test successful' });
  });
  
  return app;
};

describe('Rate Limiting Middleware', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });

  describe('General Rate Limiting', () => {
    it('allows requests within limit', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Test successful');
    });

    it('includes rate limit headers', async () => {
      const response = await request(app).get('/test');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('Auth Rate Limiting', () => {
    it('allows auth requests within limit', async () => {
      const response = await request(app).post('/auth/test');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Auth test successful');
    });

    it('blocks requests when limit exceeded', async () => {
      // Make multiple requests to exceed the limit
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(request(app).post('/auth/test'));
      }
      
      const responses = await Promise.all(promises);
      const blockedResponse = responses.find(res => res.status === 429);
      
      expect(blockedResponse).toBeDefined();
      expect(blockedResponse.body.error).toBe('Authentication rate limit exceeded');
      expect(blockedResponse.body.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
    });
  });
});
