import { Injectable, Inject } from '@nestjs/common';

import * as Client from 'swiftype-app-search-node';
import * as pRetry from 'p-retry';

import { SHOPIFY_MODULE_OPTIONS } from './shopify.constants';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
import { underscoreCase, chunkArray } from './helpers';
import { DebugService } from './debug.service';

/**
 * Swiftype Service
 */
@Injectable()
export class SwiftypeService {

  protected client: Client;

  public defaultEngineName: string;

  protected logger = new DebugService('shopify:SwiftypeService');

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) public readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    this.defaultEngineName = this.shopifyModuleOptions.swiftype.defaultEngineName;
    this.client = new Client(shopifyModuleOptions.swiftype.hostIdentifier, shopifyModuleOptions.swiftype.privateApiKey);
  }

  public getIndex(myshopifyDomain: string, resourceName: string) {
    const shopName = myshopifyDomain.replace('.myshopify.com', '');
    return `${this.shopifyModuleOptions.mongodb.database}.shopify_${shopName}:${underscoreCase(resourceName)}`;
  }

  /**
   * Send a search request to the Swiftype App Search Api
   * https://swiftype.com/documentation/app-search/
   *
   * @param query String that is used to perform a search request.
   * @param options Object used for configuring the search like search_fields and result_fields
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public search<T>(query: string, options: any = {}, engineName: string = this.defaultEngineName): Promise<T> {
    return this.client.search(engineName, query, options);
  }

  /**
   * Index a document.
   *
   * @param document document object to be indexed.
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public indexDocument<T>(document: T, engineName: string = this.defaultEngineName): Promise<T> {
    return this.client.indexDocument(engineName, document);
  }

  /**
   * Index a batch of documents.
   *
   * @param documents Array of document objects to be indexed.
   * @param engineName unique Engine name
   * @returns {Promise<Array<Object>>} a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public async indexDocuments<T>(documents: T[], engineName: string = this.defaultEngineName): Promise<T[]> {
    if (documents.length <= 0) {
      return documents;
    }
    const promises = new Array<Promise<any>>();
    if (documents.length <= 100) {
      const promise = pRetry((attemptCount) => {
        this.logger.debug(`indexDocuments attemptCount: ${attemptCount} chunk.length: ${documents.length}`);
        return this.client.indexDocuments(engineName, documents);
      }, {retries: 5});
      promises.push(promise);
    } else {
      /**
       * Split the array in chunks of 100 elements.
       * This is necessary because in swiftype can only index 100 documents at once.
       */
      const chunkedArrays = chunkArray(documents, 100);
      for (const chunk of chunkedArrays) {
        if (chunk.length) {
          const promise = pRetry<any[]>((attemptCount) => {
            this.logger.debug(`indexDocuments attemptCount: ${attemptCount} chunk.length: ${chunk.length}`);
            return this.client.indexDocuments(engineName, chunk);
          }, {retries: 5});
          promises.push(promise);
        }
      }
    }

    return Promise.all(promises)
    .catch((error) => {
      this.logger.error(error);
      this.logger.debug(`Error on documents`, documents);
      throw error;
    });
  }

  /**
   * Retrieve a batch of documents.
   *
   * @param ids Array of document ids to be retrieved
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public getDocuments<T>(ids: string[], engineName: string = this.defaultEngineName): Promise<T> {
    return this.client.getDocuments(engineName, ids);
  }

  /**
   * Destroy a batch of documents.
   *
   * @param ids Array of document ids to be destroyed
   * @param engineName unique Engine name
   * @returns {Promise<Object>} a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public destroyDocuments<T>(ids: string[], engineName: string = this.defaultEngineName): Promise<T> {
    return this.client.destroyDocuments(engineName, ids);
  }

  /**
   * List all engines
   *
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public listEngines(options: any = {}): Promise<any> {
    return this.client.listEngines(options);
  }

  /**
   * Retrieve an engine by name
   *
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public getEngine(engineName: string): Promise<any> {
    return this.client.getEngine(engineName);
  }

  /**
   * Create a new engine
   *
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public createEngine(engineName: string): Promise<any> {
    return this.client.createEngine(engineName);
  }

  /**
   * Delete an engine
   *
   * @param engineName unique Engine name
   * @returns a Promise that returns a result {Object} when resolved, otherwise throws an Error.
   */
  public destroyEngine(engineName: string): Promise<any> {
    return this.client.destroyEngine(engineName);
  }

  /**
   * Creates a jwt search key that can be used for authentication to enforce a set of required search options.
   *
   * @param apiKey the API Key used to sign the search key
   * @param apiKeyName the unique name for the API Key
   * @param options Object see the <a href="https://swiftype.com/documentation/app-search/">App Search API</a> for supported search options
   * @returns jwt search key
   */
  static createSignedSearchKey(apiKey: string, apiKeyName: string, options: any = {}): string {
    return Client.createSignedSearchKey(apiKey, apiKeyName, options);
  }
}