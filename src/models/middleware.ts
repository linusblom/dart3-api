export interface Token {
  header: {
    alg: string;
    typ: string;
    kid: string;
  };
  payload: {
    iss: string;
    sub: string;
    aud: string[];
    iat: number;
    exp: number;
    azp: string;
    scope: string;
  };
  signature: string;
}

export interface PinOptions {
  allowDisabled?: boolean;
  onlyAdmin?: boolean;
}
