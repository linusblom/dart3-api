import seedrandom from 'seedrandom';

const GOLDEN_RATIO = 0.618033988749895;

const hsvToRgb = (h: number, s: number, v: number) => {
  const hi = Math.floor(h * 6);
  const f = h * 6 - hi;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 255;
  let g = 255;
  let b = 255;

  switch (hi) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
};

const padHex = (str: string) => {
  if (str.length > 2) {
    return str;
  }

  return new Array(2 - str.length + 1).join('0') + str;
};

const rgbToHex = (rgb: number[]) => {
  const parts = rgb.map(val => padHex(val.toString(16))).join('');

  return `#${parts}`;
};

export const randomColor = () => {
  const rng = seedrandom();
  const h = (rng() + GOLDEN_RATIO) % 1;
  const rgb = hsvToRgb(h, 0.5, 0.95);
  return rgbToHex(rgb);
};
