import request from 'supertest';
import app from '../src/app';
import { uniqueSuffix, deleteUserCascade, deletePlaceCascade, createApprovedPlaceDirect } from './helpers';

describe('Favorites & Recommendations', () => {
  const suffix = uniqueSuffix();
  const email = `favrec_${suffix}@test.com`;
  const password = 'TestPass123';
  let userId: string;
  let accessToken: string;
  let placeId: string;

  beforeAll(async () => {
    const place = await createApprovedPlaceDirect();
    placeId = place.id.toString();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'FavRec Tester', email, password });
    userId = res.body.data.id;
    accessToken = res.body.data.token;
  });

  afterAll(async () => {
    if (userId) await deleteUserCascade(userId);
    if (placeId) await deletePlaceCascade(placeId);
  });

  describe('Favorites', () => {
    it('POST /favorites/places/:id/favorite adds a favorite', async () => {
      const res = await request(app)
        .post(`/api/v1/favorites/places/${placeId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Added to favorites');
    });

    it('POST /favorites/places/:id/favorite rejects a duplicate favorite', async () => {
      const res = await request(app)
        .post(`/api/v1/favorites/places/${placeId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(409);
    });

    it('GET /favorites lists the favorited place', async () => {
      const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((f: any) => f.placeId === placeId)).toBe(true);
    });

    it('DELETE /favorites/places/:id/favorite removes the favorite', async () => {
      const res = await request(app)
        .delete(`/api/v1/favorites/places/${placeId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Removed from favorites');
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/favorites');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Recommendations', () => {
    it('POST /recommendations/places/:id/recommend adds a recommendation', async () => {
      const res = await request(app)
        .post(`/api/v1/recommendations/places/${placeId}/recommend`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Place recommended');
    });

    it('POST /recommendations/places/:id/recommend rejects a duplicate recommendation', async () => {
      const res = await request(app)
        .post(`/api/v1/recommendations/places/${placeId}/recommend`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(409);
    });

    it('DELETE /recommendations/places/:id/recommend removes the recommendation', async () => {
      const res = await request(app)
        .delete(`/api/v1/recommendations/places/${placeId}/recommend`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Recommendation removed');
    });

    it('requires authentication', async () => {
      const res = await request(app).post(`/api/v1/recommendations/places/${placeId}/recommend`);
      expect(res.statusCode).toBe(401);
    });
  });
});
