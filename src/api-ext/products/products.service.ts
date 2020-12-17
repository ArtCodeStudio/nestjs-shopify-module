import { Inject, Injectable } from '@nestjs/common';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { ShopifyModuleOptions } from '../../interfaces';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';
import { DebugService } from '../../debug.service';
import { GraphQLClient } from '../../graphql-client';


@Injectable()
export class ExtProductsService {

    logger = new DebugService(`shopify:${this.constructor.name}`);

    constructor(@Inject(SHOPIFY_MODULE_OPTIONS) protected readonly shopifyModuleOptions: ShopifyModuleOptions) {}

    async listScheduled(user: IShopifyConnect, options: {
        limit: number;
        tag?: string;
    } = {limit: 50}) {
        console.log("limit", options.limit)
        const graphQLClient = new GraphQLClient(user.myshopify_domain, user.accessToken);
        const result = await graphQLClient.execute('src/api-ext/products/list-scheduled.gql', {
            first: Number(options.limit),
            query: `tag:"${options.tag}" AND status:"ACTIVE" AND published_status:"online_store:hidden" AND publishedAt:NULL`
        });
        this.logger.debug("listScheduled result", result);
        return result;
    }
}