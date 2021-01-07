import Joi from '@hapi/joi';

export const updateUserSchema = Joi.object({
  name: Joi.string(),
  nickname: Joi.string(),
  email: Joi.string().email(),
  metaData: Joi.object({
    currency: Joi.string()
      .min(1)
      .max(5),
  }),
});
