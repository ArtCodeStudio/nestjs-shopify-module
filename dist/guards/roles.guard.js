"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const debug_service_1 = require("../debug.service");
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new debug_service_1.DebugService('shopify:RolesGuard');
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const roles = this.reflector.get('roles', context.getHandler());
        return this.validateRequest(request, roles);
    }
    isLoggedIn(request) {
        this.logger.debug('isLoggedIn', request.user);
        if (request.user !== null && typeof request.user === 'object') {
            return true;
        }
        return false;
    }
    hasRole(user, roles) {
        this.logger.debug('hasRole', roles, user.roles);
        const hasRoule = user.roles.some((role) => {
            this.logger.debug('hasRole role', role);
            return roles.includes(role);
        });
        this.logger.debug('hasRole result', hasRoule);
        return hasRoule;
    }
    validateRequest(request, roles) {
        if (!roles) {
            return true;
        }
        if (!this.isLoggedIn(request)) {
            return false;
        }
        if (!this.hasRole(request.user, roles)) {
            return false;
        }
        return true;
    }
};
RolesGuard = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
exports.RolesGuard = RolesGuard;
//# sourceMappingURL=roles.guard.js.map