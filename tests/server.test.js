const request = require('supertest');
const { app, initDb } = require('../server');

describe('API', () => {
  beforeAll(async () => {
    await initDb(':memory:');
  });

  test('GET /api/resources returns array', async () => {
    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
