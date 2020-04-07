import Joi from '@hapi/joi';

export const updateUserSchema = Joi.object({
  name: Joi.string(),
  nickname: Joi.string(),
  email: Joi.string().email(),
  userMetadata: Joi.object({
    currency: Joi.string(),
  }),
});
