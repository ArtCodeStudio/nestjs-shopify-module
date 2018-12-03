import { DebugService } from '../../../debug.service';
export declare class AssetsController {
    logger: DebugService;
    listThemeAssets(req: any, res: any, themeId: number): Promise<any>;
    getThemeAsset(req: any, res: any, themeId: number, key: string): Promise<any>;
}
