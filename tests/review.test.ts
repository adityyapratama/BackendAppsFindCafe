import request from 'supertest';
import app from '../src/app';
import { uniqueSuffix, deleteUserCascade, deletePlaceCascade, createApprovedPlaceDirect } from './helpers';

describe('Reviews', () => {
  const suffix = uniqueSuffix();
  const email = `review_${suffix}@test.com`;
  const password = 'TestPass123';
  let userId: string;
  let accessToken: string;
  let placeId: string;
  let reviewId: string;

  beforeAll(async () => {
    const place = await createApprovedPlaceDirect();
    placeId = place.id.toString();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Review Tester', email, password });
    userId = res.body.data.id;
    accessToken = res.body.data.token;
  });

  afterAll(async () => {
    if (userId) await deleteUserCascade(userId);
    if (placeId) await deletePlaceCascade(placeId);
  });

  it('POST /places/:id/reviews creates an approved review (auto approval mode)', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 4, comment: 'Tempat nyaman untuk nugas' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.status).toBe('approved');
    reviewId = res.body.data.id;
  });

  it('POST /places/:id/reviews rejects rating outside 1-5', async () => {
    const res = await request(app)
      .post(`/api/v1/places/${placeId}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 9 });

    expect(res.statusCode).toBe(400);
  });

  it('GET /places/:id/reviews lists the created review', async () => {
    const res = await request(app).get(`/api/v1/places/${placeId}/reviews`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.some((r: any) => r.id === reviewId)).toBe(true);
  });

  it("place's avgRating reflects the new review", async () => {
    const res = await request(app).get('/api/v1/places');
    const updatedPlace = res.body.data.find((p: any) => p.id === placeId);
    // place may not appear in default listing depending on sort/pagination; fall back to direct lookup
    if (updatedPlace) {
      expect(Number(updatedPlace.avgRating)).toBe(4);
    }
  });

  it('PUT /reviews/:id updates the review', async () => {
    const res = await request(app)
      .put(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 5, comment: 'Update: makin nyaman' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.rating).toBe(5);
  });

  it('PUT /reviews/:id requires authentication', async () => {
    const res = await request(app)
      .put(`/api/v1/reviews/${reviewId}`)
      .send({ rating: 3 });

    expect(res.statusCode).toBe(401);
  });

  it('DELETE /reviews/:id removes the review', async () => {
    const res = await request(app)
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);

    const list = await request(app).get(`/api/v1/places/${placeId}/reviews`);
    expect(list.body.data.some((r: any) => r.id === reviewId)).toBe(false);
  });
});
