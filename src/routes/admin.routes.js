const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin', 'super_admin'));

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.get('/places', adminController.getPlaces);
router.get('/places/:id', adminController.getPlaceById);
router.patch('/places/:id/approve', adminController.approvePlace);
router.patch('/places/:id/reject', adminController.rejectPlace);
router.patch('/places/:id/archive', adminController.archivePlace);
router.patch('/places/:id/restore', adminController.restorePlace);

router.get('/reports', adminController.getReports);
router.patch('/reports/:id/resolve', adminController.resolveReport);

router.get('/edit-requests', adminController.getEditRequests);
router.patch('/edit-requests/:id/approve', adminController.approveEditRequest);
router.patch('/edit-requests/:id/reject', adminController.rejectEditRequest);

router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:id/approve', adminController.approveReview);
router.patch('/reviews/:id/reject', adminController.rejectReview);

router.get('/photos', adminController.getPhotos);
router.patch('/photos/:id/approve', adminController.approvePhoto);
router.patch('/photos/:id/reject', adminController.rejectPhoto);

router.get('/moderation-logs', adminController.getModerationLogs);

module.exports = router;
