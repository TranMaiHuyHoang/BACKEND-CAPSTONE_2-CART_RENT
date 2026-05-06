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
  it('nên gọi next() và gán req.user khi token hợp lệ', async () => {
    const mockUser = {
      _id: '66f123456789abcdef123456',
      role: 'user',
      email: 'test@example.com',
      name: 'Nguyễn Văn Test'
    };

    userModel.findById.mockResolvedValue(mockUser);

    const token = jwt.sign(
      { userId: mockUser._id },
      process.env.ACCESS_TOKEN_SECRET || 'testsecret'
    );

    req.headers.authorization = `Bearer ${token}`;

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({
      userId: mockUser._id,
      role: mockUser.role,
      email: mockUser.email,
      name: mockUser.name
    });
  });
});