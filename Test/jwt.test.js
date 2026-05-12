const { signAccessToken, verifyAccessToken } = require("../src/utils/jwt");

describe("JWT helper functions", () => {
  const payload = { userId: 123 };

  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });
  test("signAccessToken should return a valid JWT", () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe("string");
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
    test("verifyAccessToken should throw error for invalid token", () => {
    expect(() => verifyAccessToken("invalid.token")).toThrow();
  });

  test("token should expire according to JWT_EXPIRES_IN", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

})

});
