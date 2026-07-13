const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('GET /health', () => {
  afterAll(async () => {
    // Close mongoose connection if it was opened during tests
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('ts');
  });
});
