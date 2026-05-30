import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/admin.controller';
import { auth, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import * as adminValidation from '../validations/admin.validation';

router.use(auth);
router.use(authorize('admin', 'super_admin'));

router.get('/settings', adminController.getSettings);
router.put('/settings', validate(adminValidation.updateSettings), adminController.updateSettings);

router.get('/places', adminController.getPlaces);
router.get('/places/:id', adminController.getPlaceById);
router.patch('/places/:id/approve', adminController.approvePlace);
router.patch('/places/:id/reject', validate(adminValidation.reject), adminController.rejectPlace);
router.patch('/places/:id/archive', adminController.archivePlace);
router.patch('/places/:id/restore', adminController.restorePlace);

router.get('/reports', adminController.getReports);
router.patch('/reports/:id/resolve', validate(adminValidation.resolveReport), adminController.resolveReport);

router.get('/edit-requests', adminController.getEditRequests);
router.patch('/edit-requests/:id/approve', validate(adminValidation.editRequestAction), adminController.approveEditRequest);
router.patch('/edit-requests/:id/reject', validate(adminValidation.editRequestAction), adminController.rejectEditRequest);

router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:id/approve', adminController.approveReview);
router.patch('/reviews/:id/reject', validate(adminValidation.reject), adminController.rejectReview);

router.get('/photos', adminController.getPhotos);
router.patch('/photos/:id/approve', adminController.approvePhoto);
router.patch('/photos/:id/reject', validate(adminValidation.reject), adminController.rejectPhoto);

router.get('/moderation-logs', adminController.getModerationLogs);

import * as categoryController from '../controllers/category.controller';
import * as tagController from '../controllers/tag.controller';

router.post('/users', validate(adminValidation.registerAdmin), adminController.createAdminUser);

router.post('/categories', validate(adminValidation.category), categoryController.createCategory);
router.put('/categories/:id', validate(adminValidation.category), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.post('/tags', validate(adminValidation.tag), tagController.createTag);
router.put('/tags/:id', validate(adminValidation.tag), tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);

router.put('/places/:id', validate(adminValidation.updatePlace), adminController.updatePlace);
router.delete('/places/:id', adminController.deletePlace);

export default router;
