import Joi from '@hapi/joi';

export const createGamePlayerSchema = Joi.object({
  playerId: Joi.number().required(),
});
