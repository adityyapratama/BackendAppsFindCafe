import * as placeService from '../services/place.service';
import { successResponse } from '../utils/response';

const getPlaces = async (req, res, next) => {
  try {
    const result = await placeService.getPlaces(req.query);
    const { places, ...meta } = result;
    return successResponse(res, places, 'Places retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
};

const getPlaceById = async (req, res, next) => {
  try {
    const place = await placeService.getPlaceById(req.params.id);
    return successResponse(res, place, 'Place retrieved');
  } catch (error) {
    next(error);
  }
};

const createPlace = async (req, res, next) => {
  try {
    const place = await placeService.createPlace(req.body, req.user.id);

    // P1: optional cover photo uploaded together with the place (multipart).
    // The place is already persisted, so a photo failure must not fail the
    // whole request — surface it as a warning instead.
    if (req.file) {
      try {
        const photo = await placeService.uploadPhoto(place.id, req.user.id, {
          file: req.file,
          caption: req.body.caption,
          isCover: 'true',
        });
        await placeService.setCoverPhotoUrl(place.id, photo.photoUrl);
        (place as any).coverPhotoUrl = photo.photoUrl;
        (place as any).photo = photo;
      } catch (photoErr: any) {
        (place as any).photoError =
          photoErr?.message || 'Photo upload failed; place saved without a photo';
      }
    }

    return successResponse(res, place, 'Place submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyPlaces = async (req, res, next) => {
  try {
    const result = await placeService.getMyPlaces(req.user.id, req.query);
    const { places, ...meta } = result;
    return successResponse(res, places, 'My places retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
};

const uploadPhoto = async (req, res, next) => {
  try {
    const photo = await placeService.uploadPhoto(req.params.id, req.user.id, {
      file: req.file,
      caption: req.body.caption,
      isCover: req.body.isCover,
    });
    return successResponse(res, photo, 'Photo uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createEditRequest = async (req, res, next) => {
  try {
    const editRequest = await placeService.createEditRequest(req.params.id, req.user.id, req.body.proposedData);
    return successResponse(res, editRequest, 'Edit request submitted', 201);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const report = await placeService.createReport(req.params.id, req.user.id, req.body);
    return successResponse(res, report, 'Report submitted', 201);
  } catch (error) {
    next(error);
  }
};

export { getPlaces, getPlaceById, createPlace, getMyPlaces, uploadPhoto, createEditRequest, createReport };
