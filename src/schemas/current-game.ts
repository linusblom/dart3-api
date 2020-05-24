import Joi from '@hapi/joi';

export const createTeamPlayerSchema = Joi.object({
  playerId: Joi.number().required(),
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
    }),
  )
  .length(3);
