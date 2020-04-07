import { camelCase, snakeCase } from 'lodash';

export const camelize = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelize(v));
  } else if (obj && obj.constructor === Object) {
    return Object.entries(obj).reduce(
      (result, [key, value]) => ({
        ...result,
        [camelCase(key)]: camelize(value),
      }),
      {},
    );
  }
  return obj;
};

export const snakelize = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map(v => snakelize(v));
  } else if (obj && obj.constructor === Object) {
    return Object.entries(obj).reduce(
      (result, [key, value]) => ({
        ...result,
        [snakeCase(key)]: snakelize(value),
      }),
      {},
    );
  }
  return obj;
};
