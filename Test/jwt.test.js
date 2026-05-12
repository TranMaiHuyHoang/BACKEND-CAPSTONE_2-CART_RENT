const { signAccessToken, verifyAccessToken } = require("../src/utils/jwt");

describe("JWT helper functions", () => {
  const payload = { userId: 123 };

  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });
  
});
