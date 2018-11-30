"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const debug_1 = require("debug");
class DebugService extends common_1.Logger {
    constructor(name) {
        super(name);
        this.debug = debug_1.default(`${name}`);
    }
}
exports.DebugService = DebugService;
//# sourceMappingURL=debug.service.js.map