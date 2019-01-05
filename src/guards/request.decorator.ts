import { ReflectMetadata } from '@nestjs/common';
import { TRequestTypes } from '../auth/interfaces/request-type';

export const Request = (types: TRequestTypes) => ReflectMetadata('request', types);