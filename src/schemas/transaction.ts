import Joi from '@hapi/joi';
import { TransactionType } from 'dart3-sdk';

export const transactionSchema = Joi.object({
  amount: Joi.number()
    .min(1)
    .required(),
  description: Joi.string(),
});
