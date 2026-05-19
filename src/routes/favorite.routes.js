const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, favoriteController.getFavorites);
router.post('/places/:id/favorite', auth, favoriteController.addFavorite);
router.delete('/places/:id/favorite', auth, favoriteController.removeFavorite);

module.exports = router;
