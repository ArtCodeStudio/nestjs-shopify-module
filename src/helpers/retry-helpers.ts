import * as pRetry from 'p-retry';
import { Infrastructure } from 'shopify-prime';
import { OperationOptions } from 'retry';
import { FetchError } from 'node-fetch';

import { Error as MongooseError } from 'mongoose';

/**
 * wrap pRetry to handle Shopify API requests
 * options are the same as for pRetry, but an array parameter `retryHttpCodes` is added.
 * This will only retry requests which throw a Shopify error with one of the specified codes
 * OR that throw an EAI_AGAIN network error (stemming from `fetch`).
 *
 * If you want to pass 
 *
 * @param promiseFn
 * @param retryHttpCodes
 * @param options
 */
export function shopifyRetry(
  promiseFn: (attempt?: number) => Promise<any>,
  retryHttpCodes: number[] = [429],
  // default options are filled in by retry module
  // @see https://github.com/tim-kos/node-retry#retryoperationoptions
  options: OperationOptions = {}
) {
  return pRetry((n?: number) => {
      return promiseFn(n)
      .catch((e: Error) => {
        if (e instanceof Infrastructure.ShopifyError) {
          if (retryHttpCodes.indexOf(e.statusCode) === -1) {
            // this will abort the pRetry chain and make pRetry reject with the original error.
            throw new pRetry.AbortError(e);
          }
        } else if (e instanceof FetchError) {
          if (e['code'] !== 'EAI_AGAIN') {
            throw new pRetry.AbortError(e);
          }
        }
        // rethrow the error as it is: this will not abort the pRetry chain
        throw e;
      });
    },
    options
  );
}

/**
 * same usage as pRetry
 * will retry only if error is a Mongoose ParalelSaveError
 *
 * used in cases where an object might be saved multiple times in parallel, but
 * with known guaranteed compatible updates.
 *
 * @param promiseFn
 * @param options
 */
export function mongooseParallelRetry(
  promiseFn: (attempt?: number) => Promise<any>,
  options: OperationOptions = {}
) {
  return pRetry((n?: number) => {
      return promiseFn(n)
      .catch((e: Error) => {
        if (!(e instanceof MongooseError.ParallelSaveError)) {
          // this will abort the pRetry chain and make pRetry reject with the original error.
          throw new pRetry.AbortError(e);
        }
        // rethrow the error as it is: this will not abort the pRetry chain
        throw e;
      });
    },
    options)
}
