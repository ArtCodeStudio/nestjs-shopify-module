import { Inject, Injectable } from '@nestjs/common';
import { Themes, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Theme } from 'shopify-prime/models';
import { ThemeDocument } from '../interfaces/mongoose/theme.schema';
import { SyncProgressDocument } from '../../interfaces';
import { Model } from 'mongoose';
import { ShopifyApiRootService } from '../api.service';
import { EventService } from '../../event.service'

export interface IThemeListFilter {
  name?: string;
  created_at?: string;
  updated_at?: string;
  role?: 'main' | 'unpublished' | 'demo';
  previewable?: boolean;
  processing?: boolean;
}

export interface ThemeGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface ThemeListOptions extends Options.FieldOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

@Injectable()
export class ThemesService extends ShopifyApiRootService<
Theme, // ShopifyObjectType
Themes, // ShopifyModelClass
ThemeGetOptions, // GetOptions
ThemeListOptions, // ListOptions
ThemeDocument // DatabaseDocumentType
> {

  resourceName = 'themes';
  subResourceNames = ['assets'];

  constructor(
    @Inject('ThemeModelToken')
    private readonly themeModel: (shopName) => Model<ThemeDocument>,
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
  ) {
    super(themeModel, Themes, eventService, syncProgressModel);
  }

  /**
   * Retrieves a list of themes.
   * @param user
   * @param options Show only certain fields, specified by a comma-separated list of field names.
   * @param filter Filter the list by property
   * 
   * @see https://help.shopify.com/en/api/reference/online-store/theme#index
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, options?: ThemeListOptions, filter?: IThemeListFilter): Promise<Theme[]> {
    return super.listFromShopify(shopifyConnect, options)
    .then((themes) => {
      if(!filter) {
        return themes;
      } else {
        return themes.filter((theme) => {
          let matches = true;
          for (let key in filter) {
            matches = matches && (theme[key] === filter[key]);
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
  public async getActive(user: IShopifyConnect): Promise<Theme | null> {
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
