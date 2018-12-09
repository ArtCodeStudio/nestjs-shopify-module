import { Inject, Injectable } from '@nestjs/common';
import { Themes, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Theme } from 'shopify-prime/models';
import { ThemeDocument } from '../interfaces/theme.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ThemesService {
  constructor(
    @Inject('ThemeModelToken')
    private readonly themeModel: Model<ThemeDocument>,
  ) {}

  public async list(user: IShopifyConnect, options?: Options.FieldOptions): Promise<Theme[]> {
    const themes = new Themes(user.myshopify_domain, user.accessToken);
    return await themes.list(options);
  }
  public async get(user: IShopifyConnect, id: number): Promise<Theme> {
    const themes = new Themes(user.myshopify_domain, user.accessToken);
    return await themes.get(id);
  }
}
