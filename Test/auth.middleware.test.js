const request = require('supertest');
const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware'); // Đường dẫn đến file middleware
const jwt = require('jsonwebtoken'); // Để tạo token giả
const userModel = require('../src/models/user.model');

// Mock userModel
jest.mock('../src/models/user.model');

describe('Auth Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Test route sử dụng middleware
    app.get('/api/protected', authMiddleware, (req, res) => {
      res.json({
        message: 'Access granted',
        user: req.user
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  })
  it('nên trả về 401 nếu không có Authorization header', async () => {
    const res = await request(app).get('/api/protected');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Missing or invalid Authorization header');
  });
  
});