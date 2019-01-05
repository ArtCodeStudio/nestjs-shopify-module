import { ReflectMetadata } from '@nestjs/common';
import { TRoles } from '../auth/interfaces/role';

/**
 * Decorator for RolesGuard, use this with @Roles('admin') or @Roles('shopify-staff-member')
 * @param roles
 */
export const Roles = (...roles: TRoles) => ReflectMetadata('roles', roles);