"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetSwitch = void 0;
const EthernetPort_1 = __importDefault(require("./EthernetPort"));
class EthernetSwitch {
    constructor(ports, MAC) {
        this.MAC = MAC;
        this.portAddrMatrix = new Map();
        this.ports = [];
        for (let i = 0; i < ports; i++) {
            let p = new EthernetPort_1.default(this.MAC);
            p.rxStream.on("data", (data) => {
                this.handlePortData(i, data);
            });
            this.ports.push();
        }
    }
    handlePortData(port, data) {
    }
}
exports.EthernetSwitch = EthernetSwitch;
//# sourceMappingURL=EthernetSwitch.js.map