import * as recommendationService from '../services/recommendation.service';
import { successResponse } from '../utils/response';

const recommendPlace = async (req, res, next) => {
  try {
    await recommendationService.recommend(req.user.id, req.params.id);
    return successResponse(res, null, 'Place recommended', 201);
  } catch (error) { next(error); }
};

const unrecommendPlace = async (req, res, next) => {
  try {
    await recommendationService.unrecommend(req.user.id, req.params.id);
    return successResponse(res, null, 'Recommendation removed');
  } catch (error) { next(error); }
};

export { recommendPlace, unrecommendPlace };
