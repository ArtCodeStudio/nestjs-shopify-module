import { Injectable, Inject } from '@nestjs/common';
import { Client } from 'elasticsearch';

import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';
import { ShopifyModuleOptions } from '../../interfaces/shopify-module-options';

/**
 * Search api service based on Elasticsearch
 * @see https://medium.com/@mohamedeldishnawy/tutorial-sync-mongodb-with-elasticsearch-fb43e9bc13ce
 * @see https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-18-04
 */
@Injectable()
export class SearchService {
  protected client: Client;

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    this.client = new Client(shopifyModuleOptions.elasticsearch);

  }
}
