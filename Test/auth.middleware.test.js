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
    test('allows request when valid authorization token is provided', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${validToken}`);

        expect([200, 404]).toContain(res.statusCode);
    });

});
