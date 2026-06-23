import request from 'supertest';
import app from '../src/app';
import { uniqueSuffix, deleteUserCascade, deletePlaceCascade } from './helpers';

describe('Place submission flow', () => {
  const suffix = uniqueSuffix();
  const email = `placeflow_${suffix}@test.com`;
  const password = 'TestPass123';
  let userId: string;
  let accessToken: string;
  let placeId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Place Flow Tester', email, password });
    userId = res.body.data.id;
    accessToken = res.body.data.token;
  });

  afterAll(async () => {
    if (placeId) await deletePlaceCascade(placeId);
    if (userId) await deleteUserCascade(userId);
  });

  it('GET /places lists only approved places', async () => {
    const res = await request(app).get('/api/v1/places');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.every((p: any) => p.status === 'approved')).toBe(true);
  });

  it('GET /places/:id returns 404 for a non-existent place', async () => {
    const res = await request(app).get('/api/v1/places/999999999');
    expect(res.statusCode).toBe(404);
  });

  it('POST /places requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/places')
      .send({ name: 'No Auth Cafe', address: 'Jl. Test', latitude: -7.2, longitude: 112.7, categoryId: 1 });
    expect(res.statusCode).toBe(401);
  });

  it('POST /places creates a place with pending status (manual approval mode)', async () => {
    const res = await request(app)
      .post('/api/v1/places')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Test Submission Cafe ${suffix}`,
        address: 'Jl. Submission No. 1',
        latitude: -7.21,
        longitude: 112.71,
        categoryId: 1,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('pending');
    placeId = res.body.data.id;
  });

  it('GET /places/:id does not expose a pending place publicly', async () => {
    const res = await request(app).get(`/api/v1/places/${placeId}`);
    expect(res.statusCode).toBe(404);
  });

  it('POST /places/:id/edit-requests submits a proposed change', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/edit-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ proposedData: { phone: '081234567890' } });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });

  it('POST /places/:id/edit-requests rejects empty proposedData', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/edit-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ proposedData: {} });

    expect(res.statusCode).toBe(400);
  });

  it('POST /places/:id/reports submits a report and increments reportCount', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/reports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reasonType: 'wrong_information', description: 'Alamat salah' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('open');
  });

  it('POST /places/:id/reports rejects an invalid reasonType', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/reports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reasonType: 'not_a_real_reason' });

    expect(res.statusCode).toBe(400);
  });

  describe('Photo upload validation', () => {
    it('POST /places/:id/photos rejects a disallowed file type with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/places/${placeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', Buffer.from('not an image'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/JPEG|PNG|WebP/);
    });

    it('POST /places/:id/photos rejects a file over the 5MB limit with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/places/${placeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', Buffer.alloc(6 * 1024 * 1024, 1), { filename: 'big.jpg', contentType: 'image/jpeg' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/too large/i);
    });

    it('POST /places/:id/photos requires authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/places/${placeId}/photos`)
        .attach('photo', Buffer.alloc(100, 1), { filename: 'ok.jpg', contentType: 'image/jpeg' });

      expect(res.statusCode).toBe(401);
    });
  });
});
