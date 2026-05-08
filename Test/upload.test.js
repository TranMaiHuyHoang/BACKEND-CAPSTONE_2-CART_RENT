const request = require('supertest');
const path = require('path');
const app = require('../app');

describe('Upload API Tests - File Handling System', () => {
    let token;

    const user = {
        email: 'uploadtest@example.com',
        password: '12345678',
    };
    beforeAll(async () => {
        await request(app).post('/api/auth/register').send(user);

        const loginRes = await request(app).post('/api/auth/login').send(user);

        token = loginRes.body.token;
    });
});
