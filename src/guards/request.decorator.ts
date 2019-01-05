import { ReflectMetadata } from '@nestjs/common';
import { TRequestTypes } from '../auth/interfaces/request-type';

/**
 * Decorator for RequestGuard, use this with @Request('app-backend') or @Request('theme-client')
 */
export const Request = (types: TRequestTypes) => ReflectMetadata('request', types);