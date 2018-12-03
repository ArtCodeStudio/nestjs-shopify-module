"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const debug_service_1 = require("debug.service");
let ApiCacheInterceptor = class ApiCacheInterceptor extends common_1.CacheInterceptor {
    constructor() {
        super(...arguments);
        this.logger = new debug_service_1.DebugService(`shopify:ApiCacheInterceptor`);
    }
    getClientHost(request) {
        let host;
        if (request.headers.origin) {
            host = request.headers.origin.split('://')[1];
        }
        else {
            host = request.headers.host;
        }
        return host;
    }
    isLoggedIn(request) {
        this.logger.debug('isLoggedIn', request.user);
        if (request.user !== null && typeof request.user === 'object') {
            return true;
        }
        return false;
    }
    trackBy(context) {
        const request = context.getArgByIndex(0);
        let key = super.trackBy(context);
        this.logger.debug(`trackBy check key ${key}`);
        if (!key) {
            return undefined;
        }
        let host = this.getClientHost(request);
        key = `${host}:${key}`;
        this.logger.debug(`trackBy cache by ${key}`);
        return key;
    }
};
ApiCacheInterceptor = __decorate([
    common_1.Injectable()
], ApiCacheInterceptor);
exports.ApiCacheInterceptor = ApiCacheInterceptor;
//# sourceMappingURL=api-cache.interceptor.js.map