import express from 'express';
const router = express.Router();
import * as recommendationController from '../controllers/recommendation.controller';
import { auth } from '../middleware/auth';

router.post('/places/:id/recommend', auth, recommendationController.recommendPlace);
router.delete('/places/:id/recommend', auth, recommendationController.unrecommendPlace);

export default router;
