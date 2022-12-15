"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Host = void 0;
const EthernetPort_1 = __importDefault(require("./Ethernet/EthernetPort"));
class Host {
    constructor(eth0MAC, ipAddr = Buffer.alloc(4)) {
        this.ipAddr = ipAddr;
        this.eth0 = new EthernetPort_1.default(eth0MAC);
    }
}
exports.Host = Host;
//# sourceMappingURL=Host.js.map