import { ShopService } from './shop.service';
import { DebugService } from '../debug.service';
export declare class ShopController {
    private readonly shopService;
    protected logger: DebugService;
    constructor(shopService: ShopService);
    connects(res: any, req: any): Promise<any>;
    connect(id: any, res: any, req: any): Promise<any>;
}
