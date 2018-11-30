import { DynamicModule, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
export declare class ShopifyModule implements NestModule {
    static forRoot(options: ShopifyModuleOptions, database: any): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
