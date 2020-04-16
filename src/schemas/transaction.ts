import Joi from '@hapi/joi';
import { TransactionType } from 'dart3-sdk';

export const simpleTransactionSchema = Joi.object({
  type: Joi.string()
    .valid(TransactionType.Deposit, TransactionType.Withdrawal)
    .required(),
  amount: Joi.number()
    .min(1)
    .max(99999)
    .positive()
    .required(),
  description: Joi.string(),
});

export const transferTransactionSchema = Joi.object({
  type: Joi.string()
    .valid(TransactionType.Transfer)
    .required(),
  amount: Joi.number()
    .min(1)
    .max(99999)
    .positive()
    .required(),
  description: Joi.string(),
});
