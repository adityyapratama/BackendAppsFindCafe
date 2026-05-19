const Joi = require('joi');

const createPlace = Joi.object({
  name: Joi.string().max(150).required(),
  description: Joi.string().allow('', null),
  address: Joi.string().required(),
  district: Joi.string().allow('', null),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  categoryId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  priceMin: Joi.number().min(0).allow(null),
  priceMax: Joi.number().min(0).allow(null),
  phone: Joi.string().allow('', null),
  websiteUrl: Joi.string().uri().allow('', null),
  instagramUrl: Joi.string().uri().allow('', null),
  googleMapsUrl: Joi.string().uri().allow('', null),
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

module.exports = { createPlace, uploadPhoto, report };
