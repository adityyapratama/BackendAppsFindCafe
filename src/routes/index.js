const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const tagRoutes = require('./tag.routes');
const placeRoutes = require('./place.routes');
const favoriteRoutes = require('./favorite.routes');
const recommendationRoutes = require('./recommendation.routes');
const reviewRoutes = require('./review.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/places', placeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
    