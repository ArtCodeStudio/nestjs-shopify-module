import { Inject, Injectable } from '@nestjs/common';
import { Themes, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Theme } from 'shopify-prime/models';
import { ThemeDocument } from '../interfaces/mongoose/theme.schema';
import { Model } from 'mongoose';
import { ShopifyApiRootService } from '../shopify-api-root.service';
import { EventService } from '../../event.service';
import { ElasticsearchService } from '../../elasticsearch.service';

import {
  SyncProgressDocument,
  ShopifyModuleOptions,
} from '../../interfaces';
import {
  IShopifySyncThemeGetOptions,
  IShopifySyncThemeListOptions,
  IAppThemeGetOptions,
  IAppThemeListOptions,
  IAppThemeListFilter,
} from '../interfaces';

@Injectable()
export class ThemesService extends ShopifyApiRootService<
Theme, // ShopifyObjectType
Themes, // ShopifyModelClass
IShopifySyncThemeGetOptions, // GetOptions
IShopifySyncThemeListOptions, // ListOptions
ThemeDocument // DatabaseDocumentType
> {

  resourceName = 'themes';
  subResourceNames = ['assets'];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('ThemeModelToken')
    private readonly themeModel: (shopName) => Model<ThemeDocument>,
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
  ) {
    super(esService, themeModel, Themes, eventService, syncProgressModel);
  }

  /**
   * Retrieves a list of themes.
   * @param user
   * @param options Show only certain fields, specified by a comma-separated list of field names.
   * @param filter Filter the list by property
   *
   * @see https://help.shopify.com/en/api/reference/online-store/theme#index
   */
  public async listFromShopify(
    shopifyConnect: IShopifyConnect,
    options?: IAppThemeListOptions,
    filter?: IAppThemeListFilter,
  ): Promise<Partial<Theme>[]> {
    return super.listFromShopify(shopifyConnect, options)
    .then((themes) => {
      if (!filter) {
        return themes;
      } else {
        return themes.filter((theme) => {
          let matches = true;
          for (const key in filter) {
            if (filter[key]) {
              matches = matches && (theme[key] === filter[key]);
            }
          }
          return matches;
        });
      }
    });
  }

  /**
   * Retrieves the single active theme or null if no theme is active
   * @param user
   * @param id theme id
   * @see https://help.shopify.com/en/api/reference/online-store/theme#show
   */
  public async getActive(user: IShopifyConnect): Promise<Partial<Theme> | null> {
    return this.listFromShopify(user, {}, { role: 'main' })
    .then((themes) => {
      if (themes.length) {
        return themes[0];
      } else {
        return null;
      }
    });
  }
}
