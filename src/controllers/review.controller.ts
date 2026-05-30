import * as reviewService from '../services/review.service';
import { successResponse } from '../utils/response';

const getReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getReviews(req.params.id, req.query);
    const { reviews, ...meta } = result;
    return successResponse(res, reviews, 'Reviews retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.params.id, req.user.id, req.body);
    return successResponse(res, review, 'Review created', 201);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.user.id, req.body);
    return successResponse(res, review, 'Review updated');
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id);
    return successResponse(res, null, 'Review deleted');
  } catch (error) {
    next(error);
  }
};

export { getReviews, createReview, updateReview, deleteReview };
