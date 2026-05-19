const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const placeValidation = require('../validations/place.validation');

router.get('/', placeController.getPlaces);
router.get('/:id', placeController.getPlaceById);
router.post('/', auth, validate(placeValidation.createPlace), placeController.createPlace);
router.post('/:id/photos', auth, validate(placeValidation.uploadPhoto), placeController.uploadPhoto);
router.post('/:id/edit-requests', auth, placeController.createEditRequest);
router.post('/:id/reports', auth, validate(placeValidation.report), placeController.createReport);

module.exports = router;
