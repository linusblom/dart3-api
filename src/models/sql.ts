export type Param = string | number | boolean;

export interface SQLError {
  code: SQLErrorCode;
}

export enum SQLErrorCode {
  ForeignKeyViolation = '23503',
  UniqueViolation = '23505',
  CheckViolation = '23514',
}
