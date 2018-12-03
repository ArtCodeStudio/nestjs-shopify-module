import { Model } from 'mongoose';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { IShopifyShop } from './interfaces/shop';
import { DebugService } from '../debug.service';
export declare class ShopService {
    private readonly shopifyConnectModel;
    protected logger: DebugService;
    constructor(shopifyConnectModel: Model<IShopifyConnect>);
    findAll(): Promise<IShopifyShop[]>;
    findByShopifyID(id: number, fields?: string[]): Promise<IShopifyShop>;
}
