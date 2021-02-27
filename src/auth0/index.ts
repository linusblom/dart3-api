import { ManagementClient } from 'auth0';
import humps from 'humps';

const { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN } = process.env;

const auth0 = new ManagementClient({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  scope: 'read:users update:users',
});

export const getUser = async (id: string) => {
  const user = await auth0.getUser({ id });

  return humps.camelizeKeys(user);
};

export const updateUser = async (id: string, body: object) => {
  const user = await auth0.updateUser({ id }, humps.decamelizeKeys(body));

  return humps.camelizeKeys(user);
};
