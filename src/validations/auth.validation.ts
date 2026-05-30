import Joi from 'joi';

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'number')
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain at least one {#name} character',
  });

const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: passwordSchema.required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(30).allow('', null),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

const updateProfile = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(30).allow('', null),
  avatarUrl: Joi.string().uri().allow('', null),
}).min(1);

export { register, login, refreshToken, updateProfile };
