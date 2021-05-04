import { Role } from 'dart3-sdk';

export const sanitizeRoles = (roles: Role[], allowed: Role[]) =>
  roles.filter((role) => allowed.includes(role));
