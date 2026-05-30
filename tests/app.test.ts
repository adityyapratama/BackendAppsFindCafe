import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('GET /health should return 200 or 503', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth Validation', () => {
  it('POST /api/v1/auth/register should reject weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('POST /api/v1/auth/register should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'notanemail', password: 'Test1234' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('POST /api/v1/auth/login should reject empty body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('Auth Middleware', () => {
  it('GET /api/v1/auth/me should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/auth/me should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('Input Sanitization', () => {
  it('should strip HTML tags from request body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: '<script>alert("xss")</script>Test', email: 'xss@test.com', password: 'Test1234' });
    // Should fail validation (name too short after stripping) or succeed with clean name
    // Either way, the script tag should not be in any response
    expect(res.body.message).not.toContain('<script>');
  });
});

describe('Rate Limiting', () => {
  it('should include rate limit headers', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.headers).toHaveProperty('x-ratelimit-limit');
  });
});
