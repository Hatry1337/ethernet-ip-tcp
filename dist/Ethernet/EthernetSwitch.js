"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetSwitch = void 0;
const EthernetPort_1 = __importDefault(require("./EthernetPort"));
class EthernetSwitch {
    constructor(ports) {
        this.portAddrMatrix = new Map();
        this.ports = [];
        for (let i = 0; i < ports; i++) {
            let p = new EthernetPort_1.default(Buffer.alloc(6));
            p.on("frameAny", (frame, raw) => {
                this.handlePortData(i, frame, raw);
            });
            this.ports.push();
        }
    }
    handlePortData(port, frame, raw) {
        this.portAddrMatrix.set(frame.srcMAC, port);
        let dstPort = this.portAddrMatrix.get(frame.dstMAC);
        if (dstPort === undefined) {
            for (let p of this.ports) {
                p.txStream.write(raw);
            }
        }
        else {
            this.ports[dstPort].txStream.write(raw);
        }
    }
}
exports.EthernetSwitch = EthernetSwitch;
//# sourceMappingURL=EthernetSwitch.js.map