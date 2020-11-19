import { TRequestTypes } from '../auth/interfaces/request-type';

/**
 * Decorator for RequestGuard, use this with @Request('app-backend') or @Request('theme-client')
 */
export const Request = (types: TRequestTypes): MethodDecorator => { 
    return (target: any) => {
        Reflect.defineMetadata('request', types, target); // TODO NEST7 CHECKME
    }
}