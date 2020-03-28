import Joi from '@hapi/joi';

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
});
