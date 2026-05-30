import * as adminService from '../services/admin.service';
import { successResponse } from '../utils/response';

const getSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getSettings();
    return successResponse(res, settings, 'Settings retrieved');
  } catch (error) { next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await adminService.updateSettings(req.body, req.user.id);
    return successResponse(res, settings, 'Settings updated');
  } catch (error) { next(error); }
};

const getPlaces = async (req, res, next) => {
  try {
    const result = await adminService.getPlaces(req.query);
    const { places, ...meta } = result;
    return successResponse(res, places, 'Places retrieved', 200, meta);
  } catch (error) { next(error); }
};

const getPlaceById = async (req, res, next) => {
  try {
    const place = await adminService.getPlaceById(req.params.id);
    return successResponse(res, place, 'Place retrieved');
  } catch (error) { next(error); }
};

const approvePlace = async (req, res, next) => {
  try {
    const place = await adminService.approvePlace(req.params.id, req.user.id);
    return successResponse(res, place, 'Place approved');
  } catch (error) { next(error); }
};

const rejectPlace = async (req, res, next) => {
  try {
    const place = await adminService.rejectPlace(req.params.id, req.user.id, req.body.rejectionReason);
    return successResponse(res, place, 'Place rejected');
  } catch (error) { next(error); }
};

const archivePlace = async (req, res, next) => {
  try {
    const place = await adminService.archivePlace(req.params.id, req.user.id);
    return successResponse(res, place, 'Place archived');
  } catch (error) { next(error); }
};

const restorePlace = async (req, res, next) => {
  try {
    const place = await adminService.restorePlace(req.params.id, req.user.id);
    return successResponse(res, place, 'Place restored');
  } catch (error) { next(error); }
};

const getReports = async (req, res, next) => {
  try {
    const result = await adminService.getReports(req.query);
    const { reports, ...meta } = result;
    return successResponse(res, reports, 'Reports retrieved', 200, meta);
  } catch (error) { next(error); }
};

const resolveReport = async (req, res, next) => {
  try {
    const report = await adminService.resolveReport(req.params.id, req.user.id, req.body);
    return successResponse(res, report, 'Report resolved');
  } catch (error) { next(error); }
};

const getEditRequests = async (req, res, next) => {
  try {
    const result = await adminService.getEditRequests(req.query);
    const { editRequests, ...meta } = result;
    return successResponse(res, editRequests, 'Edit requests retrieved', 200, meta);
  } catch (error) { next(error); }
};

const approveEditRequest = async (req, res, next) => {
  try {
    await adminService.approveEditRequest(req.params.id, req.user.id, req.body.reviewNote);
    return successResponse(res, null, 'Edit request approved');
  } catch (error) { next(error); }
};

const rejectEditRequest = async (req, res, next) => {
  try {
    await adminService.rejectEditRequest(req.params.id, req.user.id, req.body.reviewNote);
    return successResponse(res, null, 'Edit request rejected');
  } catch (error) { next(error); }
};

const getReviews = async (req, res, next) => {
  try {
    const result = await adminService.getReviews(req.query);
    const { reviews, ...meta } = result;
    return successResponse(res, reviews, 'Reviews retrieved', 200, meta);
  } catch (error) { next(error); }
};

const approveReview = async (req, res, next) => {
  try {
    const review = await adminService.approveReview(req.params.id, req.user.id);
    return successResponse(res, review, 'Review approved');
  } catch (error) { next(error); }
};

const rejectReview = async (req, res, next) => {
  try {
    const review = await adminService.rejectReview(req.params.id, req.user.id, req.body.rejectionReason);
    return successResponse(res, review, 'Review rejected');
  } catch (error) { next(error); }
};

const getPhotos = async (req, res, next) => {
  try {
    const result = await adminService.getPhotos(req.query);
    const { photos, ...meta } = result;
    return successResponse(res, photos, 'Photos retrieved', 200, meta);
  } catch (error) { next(error); }
};

const approvePhoto = async (req, res, next) => {
  try {
    const photo = await adminService.approvePhoto(req.params.id, req.user.id);
    return successResponse(res, photo, 'Photo approved');
  } catch (error) { next(error); }
};

const rejectPhoto = async (req, res, next) => {
  try {
    const photo = await adminService.rejectPhoto(req.params.id, req.user.id, req.body.rejectionReason);
    return successResponse(res, photo, 'Photo rejected');
  } catch (error) { next(error); }
};

const getModerationLogs = async (req, res, next) => {
  try {
    const result = await adminService.getModerationLogs(req.query);
    const { logs, ...meta } = result;
    return successResponse(res, logs, 'Moderation logs retrieved', 200, meta);
  } catch (error) { next(error); }
};

const updatePlace = async (req, res, next) => {
  try {
    const place = await adminService.updatePlace(req.params.id, req.user.id, req.body);
    return successResponse(res, place, 'Place updated');
  } catch (error) { next(error); }
};

const deletePlace = async (req, res, next) => {
  try {
    await adminService.deletePlace(req.params.id, req.user.id);
    return successResponse(res, null, 'Place deleted');
  } catch (error) { next(error); }
};

const createAdminUser = async (req, res, next) => {
  try {
    const user = await adminService.createAdminUser(req.user.id, req.body);
    return successResponse(res, user, 'Admin user created', 201);
  } catch (error) { next(error); }
};

export {
  getSettings, updateSettings,
  getPlaces, getPlaceById, approvePlace, rejectPlace, archivePlace, restorePlace, updatePlace, deletePlace,
  getReports, resolveReport,
  getEditRequests, approveEditRequest, rejectEditRequest,
  getReviews, approveReview, rejectReview,
  getPhotos, approvePhoto, rejectPhoto,
  getModerationLogs,
  createAdminUser,
};
