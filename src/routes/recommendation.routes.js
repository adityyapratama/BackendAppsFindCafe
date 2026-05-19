const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { auth } = require('../middleware/auth');

router.post('/places/:id/recommend', auth, recommendationController.recommendPlace);
router.delete('/places/:id/recommend', auth, recommendationController.unrecommendPlace);

module.exports = router;
