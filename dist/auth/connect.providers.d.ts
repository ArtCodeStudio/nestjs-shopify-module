declare const shopifyConnectProviders: {
    provide: string;
    useFactory: (connection: any) => any;
    inject: string[];
}[];
export { shopifyConnectProviders };
