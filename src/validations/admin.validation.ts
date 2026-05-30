import Joi from 'joi';

const updateSettings = Joi.object({
  placeApprovalMode: Joi.string().valid('manual', 'auto'),
  reviewApprovalMode: Joi.string().valid('manual', 'auto'),
  photoApprovalMode: Joi.string().valid('manual', 'auto'),
  allowUserPlaceSubmission: Joi.boolean(),
  allowUserReviews: Joi.boolean(),
}).min(1);

const reject = Joi.object({
  rejectionReason: Joi.string().min(3).required(),
});

const resolveReport = Joi.object({
  resolutionNote: Joi.string().allow('', null),
  status: Joi.string().valid('resolved', 'dismissed').default('resolved'),
});

const editRequestAction = Joi.object({
  reviewNote: Joi.string().allow('', null),
});

const category = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string().min(2).max(50).required(),
  icon: Joi.string().allow('', null),
  sortOrder: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
});

const tag = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string().min(2).max(50).required(),
  icon: Joi.string().allow('', null),
  isActive: Joi.boolean().default(true),
});

const registerAdmin = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('', null),
});

const updatePlace = Joi.object({
  name: Joi.string().max(150),
  description: Joi.string().allow('', null),
  address: Joi.string(),
  district: Joi.string().allow('', null),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  categoryId: Joi.alternatives().try(Joi.number(), Joi.string()),
  priceMin: Joi.number().min(0).allow(null),
  priceMax: Joi.number().min(0).allow(null),
  phone: Joi.string().allow('', null),
  websiteUrl: Joi.string().uri().allow('', null),
  instagramUrl: Joi.string().uri().allow('', null),
  googleMapsUrl: Joi.string().uri().allow('', null),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'archived'),
  isActive: Joi.boolean(),
}).min(1);

export { updateSettings, reject, resolveReport, editRequestAction, category, tag, registerAdmin, updatePlace };
