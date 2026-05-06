const request = require('supertest');
const express = require('express');
const authMiddleware = require('../src/middlewares/auth.middleware'); // Đường dẫn đến file middleware
const jwt = require('jsonwebtoken'); // Để tạo token giả
const userModel = require('../src/models/user.model');

// Mock userModel
jest.mock('../src/models/user.model');

describe('Auth Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    })

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
  it('nên trả về 401 nếu header không bắt đầu bằng Bearer', async () => {
    req.headers.authorization = 'Basic abcdef123';

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing or invalid Authorization header'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('nên trả về 401 khi verifyAccessToken throw error (token hết hạn, sai signature...)', async () => {
    req.headers.authorization = 'Bearer some.token.here';

    // Giả lập lỗi từ verifyAccessToken
    jest.spyOn(require('../../utils/jwt'), 'verifyAccessToken').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});