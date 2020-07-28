import seedrandom from 'seedrandom';
import { TeamPlayer } from 'dart3-sdk';

export const gemRandomizer = () => {
  const rng = seedrandom();
  return Math.floor(rng() * 80) < 3;
};

export const arrayRandomizer = () => Math.random() - 0.5;

export const playerRandomizer = (
  players: (TeamPlayer & { pro: boolean })[],
  team: boolean,
): number[][] => {
  if (!team) {
    return players.map(({ id }) => [id]).sort(arrayRandomizer);
  }

  const proSortedPlayers = [
    ...players.filter(({ pro }) => pro).sort(arrayRandomizer),
    ...players.filter(({ pro }) => !pro).sort(arrayRandomizer),
  ];

  return Array(players.length / 2)
    .fill([])
    .map(() => [proSortedPlayers.shift().id, proSortedPlayers.pop().id])
    .sort(arrayRandomizer);
};
