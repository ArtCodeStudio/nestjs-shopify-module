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

    async listPublications(user: IShopifyConnect, options: any = {}) {
        const graphQLClient = new GraphQLClient(user.myshopify_domain, user.accessToken);
        const result = await graphQLClient.execute('src/api-ext/products/list-publications.gql', {
            first: 50
        });
        this.logger.debug("listPublications result", result);
        return result;
    }
}