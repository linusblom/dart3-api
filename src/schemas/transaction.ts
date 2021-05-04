import Joi from '@hapi/joi';
import { TransactionType } from 'dart3-sdk';

export const transactionSchema = Joi.object({
  type: Joi.string()
    .valid(TransactionType.Deposit, TransactionType.Withdrawal, TransactionType.Transfer)
    .required(),
  amount: Joi.number().min(1).required(),
  description: Joi.string(),
  receiverUid: Joi.when('type', {
    is: TransactionType.Transfer,
    then: Joi.string().required(),
    otherwise: Joi.optional().valid(null),
  }),
});

export const transactionQuerySchema = Joi.object({
  limit: Joi.number().required(),
  offset: Joi.number().required(),
});
