const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');
const { auth } = require('../middleware/auth');

router.get('/', placeController.getPlaces);
router.get('/:id', placeController.getPlaceById);
router.post('/', auth, placeController.createPlace);
router.post('/:id/photos', auth, placeController.uploadPhoto);
router.post('/:id/edit-requests', auth, placeController.createEditRequest);
router.post('/:id/reports', auth, placeController.createReport);

module.exports = router;
