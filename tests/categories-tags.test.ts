import request from 'supertest';
import app from '../src/app';

describe('Categories API', () => {
  it('GET /categories returns only active categories sorted by sortOrder', async () => {
    const res = await request(app).get('/api/v1/categories');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((c: any) => c.isActive)).toBe(true);

    const sortOrders = res.body.data.map((c: any) => c.sortOrder);
    const sorted = [...sortOrders].sort((a, b) => a - b);
    expect(sortOrders).toEqual(sorted);
  });
});

describe('Tags API', () => {
  it('GET /tags returns only active tags', async () => {
    const res = await request(app).get('/api/v1/tags');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.every((t: any) => t.isActive)).toBe(true);
  });

  it('GET /tags?type=facility filters by type', async () => {
    const res = await request(app).get('/api/v1/tags?type=facility');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every((t: any) => t.type === 'facility')).toBe(true);
  });
});
