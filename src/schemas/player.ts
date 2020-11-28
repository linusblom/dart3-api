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
  pro: Joi.boolean().required(),
  double: Joi.number()
    .min(1)
    .max(25)
    .not(21, 22, 23, 24)
    .required(),
  avatar: Joi.string()
    .regex(/^(https?:\/\/[^\s/$.?#].[^\s]*|gravatar)$/)
    .required(),
});
