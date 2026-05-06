const request = require('supertest');
const app = require('../app'); // file Express app của bạn

describe('Auth API Tests', () => {
    let token;

    const testUser = {
        email: 'testuser@example.com',
        password: '12345678',
        name: 'Test User',
    };
    test("POST /api/auth/register - should register a new user", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("user");
        expect(res.body.user.email).toBe(testUser.email);
    });

});
