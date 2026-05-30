import express from 'express';
const router = express.Router();
import * as placeController from '../controllers/place.controller';
import * as reviewController from '../controllers/review.controller';
import { auth } from '../middleware/auth';
import validate from '../middleware/validate';
import upload from '../middleware/upload';
import * as placeValidation from '../validations/place.validation';
import * as reviewValidation from '../validations/review.validation';

router.get('/', placeController.getPlaces);
router.get('/:id', placeController.getPlaceById);
router.post('/', auth, validate(placeValidation.createPlace), placeController.createPlace);
router.post('/:id/photos', auth, upload.single('photo'), placeController.uploadPhoto);
router.post('/:id/edit-requests', auth, validate(placeValidation.editRequest), placeController.createEditRequest);
router.post('/:id/reports', auth, validate(placeValidation.report), placeController.createReport);

// Place reviews
router.get('/:id/reviews', reviewController.getReviews);
router.post('/:id/reviews', auth, validate(reviewValidation.review), reviewController.createReview);

export default router;
