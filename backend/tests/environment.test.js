const request = require("supertest");
const app = require("../server");
const dbHelper = require("./dbHelper");
const mongoose = require("mongoose");

describe("Backend Test Environment Setup", () => {
  beforeAll(async () => {
    // Connect to the in-memory database
    await dbHelper.connect();
  });

  afterAll(async () => {
    // Teardown database connections
    await dbHelper.close();
  });

  test("should load environment variables correctly", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.PORT).toBe("5001");
    expect(process.env.ALPHA_VANTAGE_API_KEY).toBe("test_key");
  });

  test("should connect to in-memory database successfully", () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 means connected
  });

  test("should respond to health check endpoint /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("ts");
  });
});
