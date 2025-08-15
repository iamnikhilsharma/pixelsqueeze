const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Minimal express app with admin routes imported
const mockApp = () => {
  const app = express();
  app.use(express.json());
  // inject routes
  app.use('/api/admin/plans', require('../../server/routes/adminPlans'));
  app.use('/api/admin/subscriptions', require('../../server/routes/adminSubscriptions'));
  app.use('/api/admin/invoices', require('../../server/routes/adminInvoices'));
  return app;
};

const app = mockApp();

const adminToken = jwt.sign({ userId: 'adminId', email: 'admin@example.com', isAdmin: true }, 'test-jwt-secret');

describe('Admin API endpoints', () => {
  test('GET /api/admin/plans should return plans', async () => {
    const res = await request(app)
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PATCH /api/admin/plans/starter should update price', async () => {
    const res = await request(app)
      .patch('/api/admin/plans/starter')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ monthly: 15 })
      .expect(200);
    expect(res.body.data.price.monthly).toBe(15);
  });

  test('GET /api/admin/subscriptions should return array', async () => {
    const res = await request(app)
      .get('/api/admin/subscriptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/admin/invoices should succeed', async () => {
    const res = await request(app)
      .get('/api/admin/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
  });
});
