import express from 'express';
const router = express.Router();

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import tagRoutes from './tag.routes';
import placeRoutes from './place.routes';
import favoriteRoutes from './favorite.routes';
import recommendationRoutes from './recommendation.routes';
import reviewRoutes from './review.routes';
import adminRoutes from './admin.routes';

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/places', placeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

export default router;
    