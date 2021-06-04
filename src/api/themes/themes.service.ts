import { Inject, Injectable } from '@nestjs/common';
import { Themes } from 'shopify-admin-api'; // https://github.com/ArtCodeStudio/shopify-admin-api
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Interfaces } from 'shopify-admin-api';
import { ThemeDocument } from '../interfaces/mongoose/theme.schema';
import { Model } from 'mongoose';
import { ShopifyApiRootService } from '../shopify-api-root.service';
import { EventService } from '../../event.service';

import {
  SyncProgressDocument,
  ShopifyModuleOptions,
  Resource,
} from '../../interfaces';
import {
  IShopifySyncThemeGetOptions,
  IShopifySyncThemeListOptions,
  IAppThemeListOptions,
  IAppThemeListFilter,
} from '../interfaces';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';

@Injectable()
export class ThemesService extends ShopifyApiRootService<
  Interfaces.Theme, // ShopifyObjectType
  Themes, // ShopifyModelClass
  IShopifySyncThemeGetOptions, // GetOptions
  IShopifySyncThemeListOptions, // ListOptions
  ThemeDocument // DatabaseDocumentType
> {
  resourceName: Resource = 'themes';
  subResourceNames: Resource[] = ['assets'];

  constructor(
    @Inject('ThemeModelToken')
    private readonly themeModel: (shopName: string) => Model<ThemeDocument>,
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    super(
      themeModel,
      Themes,
      eventService,
      syncProgressModel,
      shopifyModuleOptions,
    );
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
  ): Promise<Partial<Interfaces.Theme>[]> {
    return super.listFromShopify(shopifyConnect, options).then((themes) => {
      if (!filter) {
        return themes;
      } else {
        return themes.filter((theme) => {
          let matches = true;
          for (const key in filter) {
            if (filter[key]) {
              matches = matches && theme[key] === filter[key];
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
  public async getActive(
    user: IShopifyConnect,
  ): Promise<Partial<Interfaces.Theme> | null> {
    return this.listFromShopify(user, {}, { role: 'main' }).then((themes) => {
      if (themes.length) {
        return themes[0];
      } else {
        return null;
      }
    });
  }
}
