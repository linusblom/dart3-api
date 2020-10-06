import Joi from '@hapi/joi';
import { Target } from 'dart3-sdk';

export const createTeamPlayerSchema = Joi.object({
  uid: Joi.string().required(),
});

export const createRoundSchema = Joi.array()
  .items(
    Joi.object({
      value: Joi.number()
        .min(0)
        .max(25)
        .not(21, 22, 23, 24)
        .required(),
      multiplier: Joi.number()
        .min(0)
        .max(3)
        .required(),
      bullDistance: Joi.number()
        .min(-1)
        .required(),
      target: Joi.string()
        .valid(Target.Inner, Target.Triple, Target.Outer, Target.Double, null)
        .required(),
    }),
  )
  .min(2);
