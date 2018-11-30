import { Model } from 'mongoose';
import { IShopifyAuthProfile } from './interfaces/profile';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from './interfaces/connect';
export declare class ShopifyConnectService {
    private readonly shopifyConnectModel;
    protected logger: DebugService;
    constructor(shopifyConnectModel: Model<IShopifyConnect>);
    connectOrUpdate(userProfile: IShopifyAuthProfile, accessToken: any): Promise<any>;
    findAll(): Promise<any>;
    findByDomain(domain: string): Promise<any>;
    findByShopifyId(id: number): Promise<any>;
}
