const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');

router.get('/places/:id/reviews', reviewController.getReviews);
router.post('/places/:id/reviews', auth, reviewController.createReview);
router.put('/reviews/:id', auth, reviewController.updateReview);
router.delete('/reviews/:id', auth, reviewController.deleteReview);

module.exports = router;
