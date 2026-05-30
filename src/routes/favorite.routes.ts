import express from 'express';
const router = express.Router();
import * as favoriteController from '../controllers/favorite.controller';
import { auth } from '../middleware/auth';

router.get('/', auth, favoriteController.getFavorites);
router.post('/places/:id/favorite', auth, favoriteController.addFavorite);
router.delete('/places/:id/favorite', auth, favoriteController.removeFavorite);

export default router;
