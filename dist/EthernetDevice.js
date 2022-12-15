"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetDevice = void 0;
const EthernetPort_1 = __importDefault(require("./EthernetPort"));
class EthernetDevice {
    constructor(mac) {
        this.port = new EthernetPort_1.default(mac);
        this.port.on("frame", (frame) => {
            console.log(`New frame on "${this.port.MAC}" from ${frame.dstMAC} with data "${frame.data}"`);
        });
    }
}
exports.EthernetDevice = EthernetDevice;
//# sourceMappingURL=EthernetDevice.js.map