import express from 'express';
const router = express.Router();
import * as reviewController from '../controllers/review.controller';
import { auth } from '../middleware/auth';
import validate from '../middleware/validate';
import * as reviewValidation from '../validations/review.validation';

router.put('/:id', auth, validate(reviewValidation.review), reviewController.updateReview);
router.delete('/:id', auth, reviewController.deleteReview);

export default router;
