import Joi from 'joi';

const createPlace = Joi.object({
  name: Joi.string().max(150).required(),
  description: Joi.string().allow('', null),
  address: Joi.string().required(),
  district: Joi.string().allow('', null),
  // latitude/longitude are optional: when omitted, the service falls back to
  // extracting coordinates from googleMapsUrl (P5). The "coords OR maps url"
  // requirement is enforced in place.service.createPlace so it also covers the
  // maps-url-only path.
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  categoryId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  priceMin: Joi.number().min(0).allow(null),
  priceMax: Joi.number().min(0).allow(null),
  phone: Joi.string().allow('', null),
  websiteUrl: Joi.string().uri().allow('', null),
  instagramUrl: Joi.string().uri().allow('', null),
  googleMapsUrl: Joi.string().uri().allow('', null),
  // Optional metadata that may accompany a photo on multipart create (P1).
  // The photo file itself is handled by multer (req.file), not validated here.
  caption: Joi.string().max(150).allow('', null),
  isCover: Joi.any(),
});

const uploadPhoto = Joi.object({
  photoUrl: Joi.string().uri().required(),
  caption: Joi.string().max(150).allow('', null),
  isCover: Joi.boolean().default(false),
});

const report = Joi.object({
  reasonType: Joi.string().valid('wrong_location', 'closed', 'duplicate', 'inappropriate', 'wrong_information', 'other').required(),
  description: Joi.string().allow('', null),
});

const editRequest = Joi.object({
  proposedData: Joi.object({
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
  }).required().min(1)
});

export { createPlace, uploadPhoto, report, editRequest };
