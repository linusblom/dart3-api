import Joi from '@hapi/joi';

export const createPlayerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
});
