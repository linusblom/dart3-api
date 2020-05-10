import Joi from '@hapi/joi';
import { GameType, GameVariant } from 'dart3-sdk';

export const createGameSchema = Joi.object({
  type: Joi.string()
    .valid(
      GameType.HalveIt,
      GameType.Legs,
      GameType.Three01SingleInDoubleOut,
      GameType.Three01SDoubleInDoubleOut,
      GameType.Five01SingleInDoubleOut,
      GameType.Five01DoubleInDoubleOut,
    )
    .required(),
  legs: Joi.number()
    .min(1)
    .max(3)
    .required(),
  sets: Joi.number()
    .min(1)
    .max(3)
    .required(),
  bet: Joi.number()
    .min(1)
    .max(500)
    .required(),
  variant: Joi.when('type', {
    is: [GameType.HalveIt, GameType.Legs],
    then: Joi.string()
      .valid(GameVariant.Single)
      .required(),
    otherwise: Joi.string()
      .valid(GameVariant.Single, GameVariant.Double)
      .required(),
  }),
});
