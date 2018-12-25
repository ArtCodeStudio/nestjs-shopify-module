import { Inject, Injectable } from '@nestjs/common';
import { Themes, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Theme } from 'shopify-prime/models';
import { ThemeDocument } from '../interfaces/theme.schema';
import { Model, Types } from 'mongoose';

export interface IThemeListFilter {
  name?: string;
  created_at?: string;
  updated_at?: string;
  role?: 'main' | 'unpublished' | 'demo';
  previewable?: boolean;
  processing?: boolean;
}

@Injectable()
export class ThemesService {
  constructor(
    @Inject('ThemeModelToken')
    private readonly themeModel: Model<ThemeDocument>,
  ) {}

  /**
   * Retrieves a list of themes.
   * @param user
   * @param options Show only certain fields, specified by a comma-separated list of field names.
   * @param filter Filter the list by property
   * 
   * @see https://help.shopify.com/en/api/reference/online-store/theme#index
   */
  public async list(user: IShopifyConnect, options?: Options.FieldOptions, filter?: IThemeListFilter): Promise<Theme[]> {
    const themes = new Themes(user.myshopify_domain, user.accessToken);
    return await themes.list(options)
    .then((themes) => {
      if(!filter) {
        return themes;
      } else {
        return themes.filter((theme) => {
          let matches = true;
          for (let key in filter) {
            matches = theme[key] === filter[key];
          }
          return matches;          
        });
      }
    });
  }

  /**
   * Retrieves a single theme by id
   * @param user 
   * @param id theme id
   * @see https://help.shopify.com/en/api/reference/online-store/theme#show
   */
  public async get(user: IShopifyConnect, id: number): Promise<Theme> {
    const themes = new Themes(user.myshopify_domain, user.accessToken);
    return await themes.get(id);
  }

  /**
   * Retrieves the single active theme or null if no theme is active
   * @param user 
   * @param id theme id
   * @see https://help.shopify.com/en/api/reference/online-store/theme#show
   */
  public async getActive(user: IShopifyConnect): Promise<Theme | null> {
    return await this.list(user, {}, { role: 'main' })
    .then((themes) => {
      if (themes.length) {
        return themes[0];
      } else {
        return null;
      }
    });
  }
}
