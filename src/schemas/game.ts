import Joi from '@hapi/joi';
import { GameType, GameMode } from 'dart3-sdk';

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
  mode: Joi.string()
    .valid(GameMode.Single, GameMode.Tournament)
    .required(),
  teamSize: Joi.number()
    .min(1)
    .max(2)
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
});