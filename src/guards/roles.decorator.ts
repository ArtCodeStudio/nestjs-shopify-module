import { TRoles } from '../auth/interfaces/role';

/**
 * Decorator for RolesGuard, use this with @Roles('admin') or @Roles('shopify-staff-member')
 * @param roles
 */
export const Roles = (...roles: TRoles): MethodDecorator => {
  return (target: any) => {
<<<<<<< Updated upstream
    return Reflect.defineMetadata('roles', roles, target);
=======
    return Reflect.defineMetadata('roles', roles, target); // TODO NEST7 CHECKME
>>>>>>> Stashed changes
  };
};
