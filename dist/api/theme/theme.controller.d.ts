import { DebugService } from 'debug.service';
export declare class ThemeController {
    logger: DebugService;
    constructor();
    getThemes(req: any, res: any): Promise<any>;
    getTheme(themeId: number, req: any, res: any): Promise<any>;
}
