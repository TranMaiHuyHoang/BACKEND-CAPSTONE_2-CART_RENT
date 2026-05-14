const request = require("supertest");
const app = require("./app");

describe("JWT API", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  test("GET /login should return a token", async () => {
    const res = await request(app).get("/login");
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

});