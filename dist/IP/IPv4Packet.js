"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPv4Packet = exports.IPProtocols = void 0;
var IPProtocols;
(function (IPProtocols) {
    IPProtocols[IPProtocols["ICMP"] = 1] = "ICMP";
    IPProtocols[IPProtocols["TCP"] = 6] = "TCP";
    IPProtocols[IPProtocols["UDP"] = 17] = "UDP";
})(IPProtocols = exports.IPProtocols || (exports.IPProtocols = {}));
class IPv4Packet {
    constructor(id, proto, srcAddr, dstAddr, data) {
        /** 4bit uint */
        this.version = 4;
        /** 4bit uint */
        this.headerLen = 5;
        /** 4bit */
        this.DSCP_CN = 0b00000000;
        /** 1bit flags x3 */
        this.flags = {
            reserved: 0,
            doNotFragment: 0,
            hasFragments: 0,
        };
        //** 13bit uint */
        this.fragOffset = 0;
        /** 8bit uint */
        this.TTL = 64;
        /** 16bit uint */
        this.headerChecksum = 0;
        this.id = id;
        this.proto = proto;
        this.srcAddr = srcAddr;
        this.dstAddr = dstAddr;
        this.data = data;
    }
    get length() {
        return this.headerLen * 4 + this.data.length;
    }
    packHeader() {
        let buff = Buffer.alloc(this.headerLen * 4);
        buff.writeUInt8(this.version << 4 | this.headerLen);
        buff.writeUInt8(this.DSCP_CN, 1);
        buff.writeUint16BE(this.length, 2);
        buff.writeUint16BE(this.id, 4);
        let f = this.flags.reserved << 2 | this.flags.doNotFragment << 1 | this.flags.doNotFragment;
        //2^13 - 1 = 8191 = 13 bit uint.
        if (this.fragOffset > 8191 || this.fragOffset < 0) {
            throw new Error("EFRGOFFSTOUTOFBOUNDS: fragOffset must be >= 0 and <= 8191.");
        }
        buff.writeUint16BE(f << 13 | this.fragOffset, 6);
        buff.writeUint8(this.TTL, 8);
        buff.writeUint8(this.proto, 9);
        buff.writeUint16BE(this.headerChecksum, 10);
        this.srcAddr.copy(buff, 12);
        this.dstAddr.copy(buff, 16);
        return buff;
    }
}
exports.IPv4Packet = IPv4Packet;
//# sourceMappingURL=IPv4Packet.js.map