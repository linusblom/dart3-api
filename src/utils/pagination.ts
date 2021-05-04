import { Pagination } from 'dart3-sdk';

export const mapPagination = <T>(
  response: (T & { total: number })[],
  limit: number,
  offset: number,
): Pagination<T> => ({
  total: response.length > 0 ? response[0].total : 0,
  limit: +limit,
  offset: +offset,
  items: response.map(({ total, ...rest }) => (rest as any) as T),
});
