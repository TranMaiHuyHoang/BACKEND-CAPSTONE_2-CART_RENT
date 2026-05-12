const { signAccessToken, verifyAccessToken } = require("./token");

describe("JWT helper functions", () => {
  const payload = { userId: 123 };

  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

});
