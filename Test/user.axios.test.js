const axios = require('axios');

const API_URL = 'http://localhost:3000';   // hoặc process.env.BASE_URL

describe('🔐 Protected Routes (Axios)', () => {

  let token;

  beforeAll(async () => {
    // Lấy token (cách 1: login trước)
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: '123456'
    });
    token = loginRes.data.accessToken;
  });

  it('GET /api/profile - Thành công', async () => {
    const res = await axios.get(`${API_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
    expect(res.data.user).toBeDefined();
  });

});