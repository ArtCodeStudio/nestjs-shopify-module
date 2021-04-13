import { Inject, Injectable } from "@nestjs/common";
import { IShopifyConnect } from "../../auth/interfaces/connect";
import { ShopifyModuleOptions } from "../../interfaces";
import { SHOPIFY_MODULE_OPTIONS } from "../../shopify.constants";
import { DebugService } from "../../debug.service";
import { GraphQLClient } from "../../graphql-client";

//TODO outsource
export enum SortKey {
  VENDOR = "VENDOR",
  ID = "ID",
  INVENTORY_TOTAL = "INVENTORY_TOTAL",
  PRODUCT_TYPE = "PRODUCT_TYPE",
  PUBLISHED_AT = "PUBLISHED_AT",
  RELEVANCE = "RELEVANCE",
  TITLE = "TITLE",
  UPDATED_AT = "UPDATED_AT",
  CREATED_AT = "CREATED_AT",
}

@Injectable()
export class ExtProductsService {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {}

  async listScheduled(
    user: IShopifyConnect,
    options: {
      limit: number;
      tag: string;
      sortKey: SortKey;
      reverse: boolean;
      after?: string;
    }
  ) {
    const graphQLClient = new GraphQLClient(
      user.myshopify_domain,
      user.accessToken
    );
    const result = await graphQLClient.execute(
      "src/api-ext/products/list-scheduled.gql",
      {
        first: Number(options.limit),
        query: `tag:"${options.tag}" AND status:"ACTIVE" AND published_status:"online_store:hidden" AND publishedAt:NULL`,
        sortKey: options.sortKey,
        reverse: JSON.parse((options.reverse as unknown) as string),
        after: options.after,
      }
    );
    return result;
  }

  async getPreview(
    user: IShopifyConnect,
    options: {
      id: number;
    }
  ) {
    const graphQLClient = new GraphQLClient(
      user.myshopify_domain,
      user.accessToken
    );
    const result = await graphQLClient.execute(
      "src/api-ext/products/product-by-id.gql",
      {
        id: "gid://shopify/Product/" + options.id,
      }
    );
    this.logger.debug("preview result", result);
    return result;
  }
}
