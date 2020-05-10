import seedrandom from 'seedrandom';

export const gemRandomizer = (round: number) => {
  const rng = seedrandom();
  return round < 4 && Math.floor(rng() * 80) < 3;
};
