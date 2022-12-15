"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetFrame = exports.EtherType = void 0;
var EtherType;
(function (EtherType) {
    EtherType[EtherType["IPv4"] = 2048] = "IPv4";
    EtherType[EtherType["ARP"] = 2054] = "ARP";
})(EtherType = exports.EtherType || (exports.EtherType = {}));
class EthernetFrame {
    constructor(dstMAC = Buffer.alloc(6), srcMAC = Buffer.alloc(6), typeLength = Buffer.alloc(2), data = Buffer.alloc(46)) {
        this.dstMAC = dstMAC;
        this.srcMAC = srcMAC;
        this.typeLength = typeLength;
        this.data = data;
    }
    pack() {
        return Buffer.concat([this.dstMAC, this.srcMAC, this.typeLength, this.data]);
    }
    static unpack(data) {
        let frame = new EthernetFrame();
        data.copy(frame.dstMAC, 0, 0, 6);
        data.copy(frame.srcMAC, 0, 6, 12);
        data.copy(frame.typeLength, 0, 12, 14);
        data.copy(frame.data, 0, 14, data.length - 4);
        return frame;
    }
}
exports.EthernetFrame = EthernetFrame;
//# sourceMappingURL=EthernetFrame.js.map