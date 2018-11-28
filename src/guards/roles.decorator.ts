import { ReflectMetadata } from '@nestjs/common';
import { TRoles } from '../auth/interfaces/role';

export const Roles = (...roles: TRoles) => ReflectMetadata('roles', roles);