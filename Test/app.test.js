const request = require("supertest");
const app = require("./app");

describe("JWT API", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

});