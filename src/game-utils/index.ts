import { GameType, Game } from 'dart3-sdk';

import { GameUtils } from './game';
import { X01Utils } from './x01';
import { LegsUtils } from './legs';
import { HalveItUtils } from './halve-it';

export const getGameUtils = (game: Game): GameUtils => {
  switch (game.type) {
    case GameType.Five01DoubleInDoubleOut:
    case GameType.Five01SingleInDoubleOut:
    case GameType.Three01SDoubleInDoubleOut:
    case GameType.Three01SingleInDoubleOut:
      return new X01Utils(game);
    case GameType.Legs:
      return new LegsUtils(game);
    case GameType.HalveIt:
      return new HalveItUtils(game);
  }
};
