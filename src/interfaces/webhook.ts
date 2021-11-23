import type { Error } from 'mongoose';

export interface WebhookError extends Error {
  body: any;
  apiRateLimitReached: boolean;
  errors: {
    address?: string[];
    topic?: string[];
  };
  statusCode: number;
  statusText: string;
  message: string;
}
