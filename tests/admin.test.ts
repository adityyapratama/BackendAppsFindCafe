import request from 'supertest';
import app from '../src/app';
import {
  prisma,
  uniqueSuffix,
  createAdminDirect,
  createUserDirect,
  createApprovedPlaceDirect,
  deleteUserCascade,
  deletePlaceCascade,
} from './helpers';

describe('Admin API', () => {
  const suffix = uniqueSuffix();
  const adminEmail = `admin_${suffix}@test.com`;
  const regularEmail = `regular_${suffix}@test.com`;

  let adminUserId: string;
  let regularUserId: string;
  let adminToken: string;
  let regularToken: string;

  const createdUserIds: string[] = [];
  const createdPlaceIds: string[] = [];

  beforeAll(async () => {
    const admin = await createAdminDirect(adminEmail);
    adminUserId = admin.id.toString();

    const regular = await createUserDirect(regularEmail, 'user');
    regularUserId = regular.id.toString();

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'AdminPass123' });
    adminToken = adminLogin.body.data.token;

    const regularLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: regularEmail, password: 'TestPass123' });
    regularToken = regularLogin.body.data.token;
  });

  afterAll(async () => {
    for (const id of createdPlaceIds) await deletePlaceCascade(id);
    if (adminUserId) await deleteUserCascade(adminUserId);
    if (regularUserId) await deleteUserCascade(regularUserId);
    for (const id of createdUserIds) await deleteUserCascade(id);
  });

  describe('Authorization', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/admin/settings');
      expect(res.statusCode).toBe(401);
    });

    it('rejects non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Settings', () => {
    it('GET /admin/settings retrieves current settings', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('placeApprovalMode');
    });

    it('PUT /admin/settings updates and reverts a setting', async () => {
      const current = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      const originalMode = current.body.data.allowUserReviews;

      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ allowUserReviews: !originalMode });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.allowUserReviews).toBe(!originalMode);

      // Revert immediately so other suites are unaffected
      const revert = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ allowUserReviews: originalMode });
      expect(revert.body.data.allowUserReviews).toBe(originalMode);
    });

    it('PUT /admin/settings rejects an empty body', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Categories CRUD', () => {
    const slug = `test-cat-${suffix}`;
    let categoryId: string;

    it('POST /admin/categories creates a category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test Category ${suffix}`, slug });

      expect(res.statusCode).toBe(201);
      categoryId = res.body.data.id;
    });

    it('GET /admin/categories lists the category', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });

    it('PUT /admin/categories/:id updates the category', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test Category Updated ${suffix}`, slug, sortOrder: 99 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe(`Test Category Updated ${suffix}`);
    });

    it('PUT /admin/categories/:id allows a partial update', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sortOrder: 42, isActive: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.sortOrder).toBe(42);
      expect(res.body.data.isActive).toBe(false);
    });

    it('GET /admin/categories still shows an inactive category (unlike the public endpoint)', async () => {
      const [adminRes, publicRes] = await Promise.all([
        request(app).get('/api/v1/admin/categories').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/v1/categories'),
      ]);

      expect(adminRes.statusCode).toBe(200);
      expect(adminRes.body.data.some((c: any) => c.id === categoryId)).toBe(true);
      expect(publicRes.body.data.some((c: any) => c.id === categoryId)).toBe(false);
    });

    it('PUT /admin/categories/:id rejects an empty body', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('PUT /admin/categories/:id returns 400 for a non-numeric id', async () => {
      const res = await request(app)
        .put('/api/v1/admin/categories/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sortOrder: 1 });

      expect(res.statusCode).toBe(400);
    });

    it('DELETE /admin/categories/:id returns 409 when the category is still used by a place', async () => {
      const place = await createApprovedPlaceDirect({ categoryId: BigInt(categoryId) });
      createdPlaceIds.push(place.id.toString());

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // clean up before asserting so a failure doesn't leave the category referenced
      await deletePlaceCascade(place.id);

      expect(res.statusCode).toBe(409);
    });

    it('DELETE /admin/categories/:id removes the category', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Tags CRUD', () => {
    const slug = `test-tag-${suffix}`;
    let tagId: string;

    it('POST /admin/tags creates a tag', async () => {
      const res = await request(app)
        .post('/api/v1/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test Tag ${suffix}`, slug, type: 'facility' });

      expect(res.statusCode).toBe(201);
      tagId = res.body.data.id;
    });

    it('GET /admin/tags lists the tag', async () => {
      const res = await request(app)
        .get('/api/v1/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((t: any) => t.id === tagId)).toBe(true);
    });

    it('POST /admin/tags rejects a missing type', async () => {
      const res = await request(app)
        .post('/api/v1/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test Tag No Type ${suffix}`, slug: `${slug}-notype` });

      expect(res.statusCode).toBe(400);
    });

    it('PUT /admin/tags/:id updates the tag', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/tags/${tagId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test Tag Updated ${suffix}`, slug, type: 'facility' });

      expect(res.statusCode).toBe(200);
    });

    it('PUT /admin/tags/:id allows a partial update', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/tags/${tagId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('PUT /admin/tags/:id rejects an empty body', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/tags/${tagId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('DELETE /admin/tags/:id removes the tag', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/tags/${tagId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Create admin user', () => {
    it('POST /admin/users creates a new admin', async () => {
      const newAdminEmail = `created_admin_${suffix}@test.com`;
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Created Admin', email: newAdminEmail, password: 'CreatedPass123' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('admin');
      createdUserIds.push(res.body.data.id);
    });
  });

  describe('Place moderation workflow', () => {
    let placeId: string;

    beforeAll(async () => {
      const place = await prisma.place.create({
        data: {
          name: `Pending Mod Cafe ${suffix}`,
          slug: `pending-mod-cafe-${suffix}`,
          address: 'Jl. Moderasi No. 1',
          latitude: -7.26,
          longitude: 112.76,
          categoryId: 1n,
          status: 'pending',
          submittedBy: BigInt(regularUserId),
        },
      });
      placeId = place.id.toString();
      createdPlaceIds.push(placeId);
    });

    it('GET /admin/places?status=pending lists the place', async () => {
      const res = await request(app)
        .get('/api/v1/admin/places?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((p: any) => p.id === placeId)).toBe(true);
    });

    it('GET /admin/places/:id returns full detail', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/places/${placeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(placeId);
    });

    it('PATCH /admin/places/:id/approve approves the place', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/places/${placeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('PATCH /admin/places/:id/archive archives the place', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/places/${placeId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    it('PATCH /admin/places/:id/restore restores the place to pending', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/places/${placeId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('pending');
    });

    it('PATCH /admin/places/:id/reject rejects the place with a reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/places/${placeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Lokasi tidak valid' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');
    });

    it('PATCH /admin/places/:id/reject requires a reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/places/${placeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('PUT /admin/places/:id force-updates place data', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/places/${placeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Force Updated Cafe ${suffix}` });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe(`Force Updated Cafe ${suffix}`);
    });

    it('PUT /admin/places/:id accepts isPermanentlyClosed', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/places/${placeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPermanentlyClosed: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isPermanentlyClosed).toBe(true);
    });

    it('DELETE /admin/places/:id hard-deletes the place', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/places/${placeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      createdPlaceIds.splice(createdPlaceIds.indexOf(placeId), 1);

      const check = await prisma.place.findUnique({ where: { id: BigInt(placeId) } });
      expect(check).toBeNull();
    });
  });

  describe('Reports moderation', () => {
    let placeId: string;
    let reportId: string;

    beforeAll(async () => {
      const place = await prisma.place.create({
        data: {
          name: `Report Target Cafe ${suffix}`,
          slug: `report-target-cafe-${suffix}`,
          address: 'Jl. Laporan No. 1',
          latitude: -7.27,
          longitude: 112.77,
          categoryId: 1n,
          status: 'approved',
        },
      });
      placeId = place.id.toString();
      createdPlaceIds.push(placeId);

      const report = await prisma.report.create({
        data: {
          placeId: BigInt(placeId),
          reportedBy: BigInt(regularUserId),
          reasonType: 'closed',
          description: 'Sudah tutup permanen',
        },
      });
      reportId = report.id.toString();
    });

    it('GET /admin/reports?status=open lists the report', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports?status=open')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((r: any) => r.id === reportId)).toBe(true);
    });

    it('PATCH /admin/reports/:id/resolve resolves the report', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${reportId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolutionNote: 'Sudah dikonfirmasi tutup' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('resolved');
    });

    it('PATCH /admin/reports/:id/resolve accepts status dismissed (stored as rejected)', async () => {
      const report = await prisma.report.create({
        data: {
          placeId: BigInt(placeId),
          reportedBy: BigInt(regularUserId),
          reasonType: 'other',
          description: 'e2e dismiss test',
        },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/reports/${report.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'dismissed', resolutionNote: 'not valid' });

      expect(res.statusCode).toBe(200);
      // DB check constraint only allows open/reviewed/resolved/rejected
      expect(res.body.data.status).toBe('rejected');
    });
  });

  describe('Edit requests moderation', () => {
    let placeId: string;
    let approveRequestId: string;
    let rejectRequestId: string;

    beforeAll(async () => {
      const place = await prisma.place.create({
        data: {
          name: `Edit Request Cafe ${suffix}`,
          slug: `edit-request-cafe-${suffix}`,
          address: 'Jl. Edit No. 1',
          latitude: -7.28,
          longitude: 112.78,
          categoryId: 1n,
          status: 'approved',
        },
      });
      placeId = place.id.toString();
      createdPlaceIds.push(placeId);

      const approveReq = await prisma.placeEditRequest.create({
        data: { placeId: BigInt(placeId), submittedBy: BigInt(regularUserId), proposedData: { phone: '081111111111' } },
      });
      approveRequestId = approveReq.id.toString();

      const rejectReq = await prisma.placeEditRequest.create({
        data: { placeId: BigInt(placeId), submittedBy: BigInt(regularUserId), proposedData: { phone: '082222222222' } },
      });
      rejectRequestId = rejectReq.id.toString();
    });

    it('GET /admin/edit-requests?status=pending lists both requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/edit-requests?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.data.map((r: any) => r.id);
      expect(ids).toContain(approveRequestId);
      expect(ids).toContain(rejectRequestId);
    });

    it('PATCH /admin/edit-requests/:id/approve applies the proposed data', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/edit-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNote: 'Looks good' });

      expect(res.statusCode).toBe(200);

      const place = await prisma.place.findUnique({ where: { id: BigInt(placeId) } });
      expect(place?.phone).toBe('081111111111');
    });

    it('PATCH /admin/edit-requests/:id/reject rejects without applying changes', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/edit-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNote: 'Data tidak valid' });

      expect(res.statusCode).toBe(200);

      const place = await prisma.place.findUnique({ where: { id: BigInt(placeId) } });
      expect(place?.phone).toBe('081111111111'); // unchanged from the approved request
    });
  });

  describe('Review moderation', () => {
    let placeId: string;
    let approveReviewId: string;
    let rejectReviewId: string;

    beforeAll(async () => {
      const place = await prisma.place.create({
        data: {
          name: `Review Mod Cafe ${suffix}`,
          slug: `review-mod-cafe-${suffix}`,
          address: 'Jl. Review No. 1',
          latitude: -7.29,
          longitude: 112.79,
          categoryId: 1n,
          status: 'approved',
        },
      });
      placeId = place.id.toString();
      createdPlaceIds.push(placeId);

      const r1 = await prisma.review.create({
        data: { placeId: BigInt(placeId), userId: BigInt(regularUserId), rating: 5, comment: 'Pending review 1', status: 'pending' },
      });
      approveReviewId = r1.id.toString();
    });

    it('GET /admin/reviews?status=pending lists the pending review', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reviews?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((r: any) => r.id === approveReviewId)).toBe(true);
    });

    it('PATCH /admin/reviews/:id/approve approves and recalculates rating', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${approveReviewId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');

      const place = await prisma.place.findUnique({ where: { id: BigInt(placeId) } });
      expect(Number(place?.avgRating)).toBe(5);
    });

    it('PATCH /admin/reviews/:id/reject rejects a second pending review', async () => {
      const r2 = await prisma.review.create({
        data: { placeId: BigInt(placeId), userId: BigInt(adminUserId), rating: 1, comment: 'Pending review 2', status: 'pending' },
      });
      rejectReviewId = r2.id.toString();

      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${rejectReviewId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Konten tidak relevan' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');

      // Rejected review must not affect avgRating
      const place = await prisma.place.findUnique({ where: { id: BigInt(placeId) } });
      expect(Number(place?.avgRating)).toBe(5);
    });
  });

  describe('Photo moderation', () => {
    let placeId: string;
    let approvePhotoId: string;
    let rejectPhotoId: string;

    beforeAll(async () => {
      const place = await prisma.place.create({
        data: {
          name: `Photo Mod Cafe ${suffix}`,
          slug: `photo-mod-cafe-${suffix}`,
          address: 'Jl. Foto No. 1',
          latitude: -7.3,
          longitude: 112.8,
          categoryId: 1n,
          status: 'approved',
        },
      });
      placeId = place.id.toString();
      createdPlaceIds.push(placeId);

      const p1 = await prisma.placePhoto.create({
        data: { placeId: BigInt(placeId), uploadedBy: BigInt(regularUserId), photoUrl: 'https://example.com/p1.jpg', status: 'pending' },
      });
      approvePhotoId = p1.id.toString();

      const p2 = await prisma.placePhoto.create({
        data: { placeId: BigInt(placeId), uploadedBy: BigInt(regularUserId), photoUrl: 'https://example.com/p2.jpg', status: 'pending' },
      });
      rejectPhotoId = p2.id.toString();
    });

    it('GET /admin/photos?status=pending lists both photos', async () => {
      const res = await request(app)
        .get('/api/v1/admin/photos?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.data.map((p: any) => p.id);
      expect(ids).toContain(approvePhotoId);
      expect(ids).toContain(rejectPhotoId);
    });

    it('PATCH /admin/photos/:id/approve approves the photo', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/photos/${approvePhotoId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('PATCH /admin/photos/:id/reject rejects the photo with a reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/photos/${rejectPhotoId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Foto buram' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');
    });
  });

  describe('Moderation logs', () => {
    it('GET /admin/moderation-logs returns an audit trail', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
