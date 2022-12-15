import { Writable } from "stream";

export enum PCAPNGBlockType {
    SectionHeaderBlock = 0x0A0D0D0A,
    SimplePacketBlock = 0x00000003,
    InterfaceDescriptionBlock = 0x00000001,
}

export enum PCAPNGLinkType {
    LINKTYPE_NULL = 0,
    LINKTYPE_ETHERNET = 1,
    LINKTYPE_PPP = 9,
    LINKTYPE_PPP_ETHER = 51,
    LINKTYPE_RAW = 101,
    LINKTYPE_IPV4 = 228,
    LINKTYPE_IPV6 = 229,
}

export class PCAPDump {
    public static createBlock(type: PCAPNGBlockType, body: Buffer) {
        let padding = 0;

        if((12 + body.length) % 4 !== 0) {
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

    public static createSectionHeader() {
        let buff = Buffer.alloc(16);

        buff.writeUInt32LE(0x1A2B3C4D);
        buff.writeUint16LE(1, 4);
        buff.writeUint16LE(0, 6);
        buff.writeBigInt64LE(BigInt(-1), 8);

        let header = PCAPDump.createBlock(PCAPNGBlockType.SectionHeaderBlock, buff);

        console.log("PCAP_HDR=[", header.toString("hex").toUpperCase().match(/.{1,2}/g)?.join(" "), "]");
        return header;
    }

    public static createInterfaceDescBlock() {
        let buff = Buffer.alloc(8);

        buff.writeUint16LE(PCAPNGLinkType.LINKTYPE_ETHERNET);

        return PCAPDump.createBlock(PCAPNGBlockType.InterfaceDescriptionBlock, buff);
    }

    public static createPacketBlock(packet: Buffer) {
        let buff = Buffer.alloc(4 + packet.length);

        buff.writeUInt32LE(packet.length);
        packet.copy(buff, 4);

        return PCAPDump.createBlock(PCAPNGBlockType.SimplePacketBlock, buff);
    }

    public static dumpData(data: Buffer, output: Writable) {
        let pcap = PCAPDump.createPacketBlock(data);
        if(output.writable){
            try {
                output.write(pcap);
            } catch (e) {
                console.log(e);
            }
        }
    }
}