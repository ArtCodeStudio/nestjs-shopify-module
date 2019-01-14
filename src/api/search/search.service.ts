import { Injectable, Inject } from '@nestjs/common';
import { Client as ElasticSearchClient } from 'elasticsearch';

import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';
import { ElasticsearchService } from '../../elasticsearch.service';

/**
 * Search api service based on Elasticsearch
 * @see https://medium.com/@mohamedeldishnawy/tutorial-sync-mongodb-with-elasticsearch-fb43e9bc13ce
 * @see https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-18-04
 */
@Injectable()
export class SearchService {
  constructor(
    protected readonly esService: ElasticsearchService,
  ) {

  }
}
