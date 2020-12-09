import { GraphQLClient as _GraphQLClient, gql } from 'graphql-request'
import type { Variables, RequestDocument } from 'graphql-request/dist/types'
import { promises as fs } from 'fs';
import { resolve, normalize } from 'path';
import findRoot = require("find-root");

export class GraphQLClient extends _GraphQLClient {

  protected apiVersion = '2020-10';

  protected root = findRoot(process.cwd());

  constructor(
    protected shopDomain: string, protected accessToken: string, apiVersion = '2020-10'
  ) {
    super(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,{
      headers: {
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
    })
  }

  async loadRequestDocument(filePath: string): Promise<RequestDocument> {
    const content = await fs.readFile(normalize(resolve(this.root, filePath)), 'utf8');
    return gql`${content}`;
  }

  /**
   * Execute a server-side GraphQL query within the given context.
   * @param options
   * @param queryFilePath
   */
  async execute(actionFilePath: string, variables?: Variables) {
    const action = await this.loadRequestDocument(actionFilePath)
    return this.request(action, variables)
  }

}
