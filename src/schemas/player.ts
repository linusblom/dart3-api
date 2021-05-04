import Joi from '@hapi/joi';
import { Role } from 'dart3-sdk';

export const createPlayerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  terms: Joi.boolean().required().valid(true),
});

export const updatePlayerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  roles: Joi.array().items(Role.Pro).required(),
  single: Joi.number().min(1).max(25).not(21, 22, 23, 24).required(),
  double: Joi.number().min(1).max(25).not(21, 22, 23, 24).required(),
  triple: Joi.number().min(1).max(25).not(21, 22, 23, 24).required(),
  avatar: Joi.string()
    .regex(/^(https?:\/\/[^\s/$.?#].[^\s]*|gravatar)$/)
    .required(),
});

export const verifyEmailSchema = Joi.object({
  uid: Joi.string()
    .length(20)
    .pattern(/^[A-Za-z0-9_-]+$/)
    .required(),
  token: Joi.string()
    .length(64)
    .pattern(/^[A-Za-z0-9_-]+$/)
    .required(),
});
