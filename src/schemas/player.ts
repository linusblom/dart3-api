import Joi from '@hapi/joi';
import { TransactionType } from 'dart3-sdk';

export const createPlayerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .required(),
  email: Joi.string()
    .email()
    .required(),
});

export const updatePlayerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .required(),
  pro: Joi.boolean().required(),
});
