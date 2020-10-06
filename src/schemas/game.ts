import Joi from '@hapi/joi';
import { GameType, Check } from 'dart3-sdk';

export const createGameSchema = Joi.object({
  type: Joi.string()
    .valid(GameType.HalveIt, GameType.Legs, GameType.X01)
    .required(),
  tournament: Joi.boolean().required(),
  random: Joi.boolean().required(),
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
  startScore: Joi.number()
    .allow(0, 3, 5, 7, 301, 501, 701)
    .required(),
  checkIn: Joi.string()
    .valid(Check.Straight, Check.Double, Check.Master)
    .required(),
  checkOut: Joi.string()
    .valid(Check.Straight, Check.Double, Check.Master)
    .required(),
  tieBreak: Joi.number()
    .allow(0, 10, 15, 20, 25, 30)
    .required(),
});
