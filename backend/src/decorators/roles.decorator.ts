import { Role } from '../entities/role.enum';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'role';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
// export const Roles = Reflector.createDecorator<Role[]>();
