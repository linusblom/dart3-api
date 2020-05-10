import Joi from '@hapi/joi';

export const createGamePlayerSchema = Joi.object({
  playerId: Joi.number().required(),
});

export const submitRoundSchema = Joi.object({
  scores: Joi.array()
    .min(3)
    .max(3)
    .items(
      Joi.object({
        value: Joi.number()
          .min(0)
          .max(25)
          .required(),
        multiplier: Joi.number()
          .min(0)
          .max(3)
          .required(),
      }),
    ),
});
