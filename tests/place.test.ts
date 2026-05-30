import request from 'supertest';
import app from '../src/app';

describe('Places API', () => {
  it('GET /api/v1/places should return list of places', async () => {
    const res = await request(app).get('/api/v1/places');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/v1/places/:id should return 404 for invalid id', async () => {
    const res = await request(app).get('/api/v1/places/999999999');
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/v1/places should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/places')
      .send({
        name: 'Test Cafe',
        address: 'Jl. Test',
        latitude: -7.2,
        longitude: 112.7,
        categoryId: 1
      });
    expect(res.statusCode).toBe(401);
  });
});
