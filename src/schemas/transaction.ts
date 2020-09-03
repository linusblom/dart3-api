import Joi from '@hapi/joi';

export const transactionSchema = Joi.object({
  amount: Joi.number()
    .min(1)
    .required(),
  description: Joi.string(),
});
