const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const reviewValidation = require('../validations/review.validation');

router.get('/places/:id/reviews', reviewController.getReviews);
router.post('/places/:id/reviews', auth, validate(reviewValidation.review), reviewController.createReview);
router.put('/reviews/:id', auth, validate(reviewValidation.review), reviewController.updateReview);
router.delete('/reviews/:id', auth, reviewController.deleteReview);

module.exports = router;
