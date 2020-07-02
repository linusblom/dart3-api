import Joi from '@hapi/joi';
import { GameType } from 'dart3-sdk';

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
  tournament: Joi.boolean().required(),
  team: Joi.boolean().required(),
  legs: Joi.number()
    .allow(1, 3, 5)
    .required(),
  sets: Joi.number()
    .allow(1, 3, 5)
    .required(),
  bet: Joi.number()
    .allow(10, 20, 50, 100, 200, 500, 1000)
    .required(),
});
