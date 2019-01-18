import { Injectable, Inject } from '@nestjs/common';
import { Client } from 'elasticsearch';

import { SHOPIFY_MODULE_OPTIONS } from './shopify.constants';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
import { underscoreCase } from './helpers';

/**
 * Elasticsearch Service
 * @see https://medium.com/@mohamedeldishnawy/tutorial-sync-mongodb-with-elasticsearch-fb43e9bc13ce
 * @see https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-18-04
 */
@Injectable()
export class ElasticsearchService {

  public client: Client;

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) public readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    this.client = new Client(shopifyModuleOptions.elasticsearch);
  }

  public getIndex(myshopifyDomain: string, resourceName: string) {
    const shopName = myshopifyDomain.replace('.myshopify.com', '');
    return `${this.shopifyModuleOptions.mongodb.database}.shopify_${shopName}:${underscoreCase(resourceName)}`;
  }
}