"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PCAPDump = exports.PCAPNGLinkType = exports.PCAPNGBlockType = void 0;
var PCAPNGBlockType;
(function (PCAPNGBlockType) {
    PCAPNGBlockType[PCAPNGBlockType["SectionHeaderBlock"] = 168627466] = "SectionHeaderBlock";
    PCAPNGBlockType[PCAPNGBlockType["SimplePacketBlock"] = 3] = "SimplePacketBlock";
    PCAPNGBlockType[PCAPNGBlockType["InterfaceDescriptionBlock"] = 1] = "InterfaceDescriptionBlock";
})(PCAPNGBlockType = exports.PCAPNGBlockType || (exports.PCAPNGBlockType = {}));
var PCAPNGLinkType;
(function (PCAPNGLinkType) {
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_NULL"] = 0] = "LINKTYPE_NULL";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_ETHERNET"] = 1] = "LINKTYPE_ETHERNET";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_PPP"] = 9] = "LINKTYPE_PPP";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_PPP_ETHER"] = 51] = "LINKTYPE_PPP_ETHER";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_RAW"] = 101] = "LINKTYPE_RAW";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_IPV4"] = 228] = "LINKTYPE_IPV4";
    PCAPNGLinkType[PCAPNGLinkType["LINKTYPE_IPV6"] = 229] = "LINKTYPE_IPV6";
})(PCAPNGLinkType = exports.PCAPNGLinkType || (exports.PCAPNGLinkType = {}));
class PCAPDump {
    static createBlock(type, body) {
        let padding = 0;
        if ((12 + body.length) % 4 !== 0) {
            while ((12 + body.length + padding) % 4 !== 0) {
                padding++;
            }
        }
        let buff = Buffer.alloc(12 + body.length + padding);
        buff.writeUInt32LE(type);
        buff.writeUInt32LE(12 + body.length + padding, 4);
        body.copy(buff, 8);
        buff.writeUInt32LE(12 + body.length + padding, buff.length - 4);
        return buff;
    }
    static createSectionHeader() {
        var _a;
        let buff = Buffer.alloc(16);
        buff.writeUInt32LE(0x1A2B3C4D);
        buff.writeUint16LE(1, 4);
        buff.writeUint16LE(0, 6);
        buff.writeBigInt64LE(BigInt(-1), 8);
        let header = PCAPDump.createBlock(PCAPNGBlockType.SectionHeaderBlock, buff);
        console.log("PCAP_HDR=[", (_a = header.toString("hex").toUpperCase().match(/.{1,2}/g)) === null || _a === void 0 ? void 0 : _a.join(" "), "]");
        return header;
    }
    static createInterfaceDescBlock() {
        let buff = Buffer.alloc(8);
        buff.writeUint16LE(PCAPNGLinkType.LINKTYPE_ETHERNET);
        return PCAPDump.createBlock(PCAPNGBlockType.InterfaceDescriptionBlock, buff);
    }
    static createPacketBlock(packet) {
        let buff = Buffer.alloc(4 + packet.length);
        buff.writeUInt32LE(packet.length);
        packet.copy(buff, 4);
        return PCAPDump.createBlock(PCAPNGBlockType.SimplePacketBlock, buff);
    }
    static dumpData(data, output) {
        let pcap = PCAPDump.createPacketBlock(data);
        if (output.writable) {
            try {
                output.write(pcap);
            }
            catch (e) {
                console.log(e);
            }
        }
    }
}
exports.PCAPDump = PCAPDump;
//# sourceMappingURL=PCAPDump.js.map