import * as favoriteService from '../services/favorite.service';
import { successResponse } from '../utils/response';

const getFavorites = async (req, res, next) => {
  try {
    const result = await favoriteService.getFavorites(req.user.id, req.query);
    const { favorites, ...meta } = result;
    return successResponse(res, favorites, 'Favorites retrieved', 200, meta);
  } catch (error) { next(error); }
};

const addFavorite = async (req, res, next) => {
  try {
    await favoriteService.addFavorite(req.user.id, req.params.id);
    return successResponse(res, null, 'Added to favorites', 201);
  } catch (error) { next(error); }
};

const removeFavorite = async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user.id, req.params.id);
    return successResponse(res, null, 'Removed from favorites');
  } catch (error) { next(error); }
};

export { getFavorites, addFavorite, removeFavorite };
