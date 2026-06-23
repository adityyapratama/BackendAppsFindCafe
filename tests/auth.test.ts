import request from 'supertest';
import app from '../src/app';
import { prisma, uniqueSuffix, deleteUserCascade } from './helpers';

describe('Auth API', () => {
  const suffix = uniqueSuffix();
  const email = `auth_${suffix}@test.com`;
  const password = 'TestPass123';
  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    if (userId) await deleteUserCascade(userId);
  });

  it('POST /auth/register creates a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Auth Tester', email, password });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();

    userId = res.body.data.id;
  });

  it('POST /auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Auth Tester 2', email, password });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass123' });

    expect(res.statusCode).toBe(401);
  });

  it('POST /auth/login succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(email);

    accessToken = res.body.data.token;
    refreshToken = res.body.data.refreshToken;
  });

  it('refresh token expires in ~7 days (JWT_REFRESH_EXPIRES_IN), not 30', async () => {
    const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    const daysUntilExpiry = (record!.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilExpiry).toBeGreaterThan(6.9);
    expect(daysUntilExpiry).toBeLessThan(7.1);
  });

  it('rejects a refresh token used as a bearer access token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.statusCode).toBe(401);
  });

  it('GET /auth/me returns the logged-in user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

  it('PUT /auth/profile updates the profile', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Auth Tester Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Auth Tester Updated');
  });

  it('POST /auth/refresh rotates the refresh token', async () => {
    const oldRefreshToken = refreshToken;
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.refreshToken).not.toBe(oldRefreshToken);

    refreshToken = res.body.data.refreshToken;

    // Old refresh token must now be revoked
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken });
    expect(reuseRes.statusCode).toBe(401);
  });

  it('POST /auth/logout revokes the current refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);

    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(reuseRes.statusCode).toBe(401);
  });
});
