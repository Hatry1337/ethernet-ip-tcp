export enum EtherType {
    IPv4 = 0x0800,
    ARP = 0x0806
}

export class EthernetFrame {
    constructor(public dstMAC: Buffer = Buffer.alloc(6),
                public srcMAC: Buffer = Buffer.alloc(6),
                public typeLength: Buffer = Buffer.alloc(2),
                public data: Buffer = Buffer.alloc(46)) {
    }

    public pack() {
        return Buffer.concat([ this.dstMAC, this.srcMAC, this.typeLength, this.data ]);
    }

    public static unpack(data: Buffer) {
        let frame = new EthernetFrame();
        data.copy(frame.dstMAC, 0, 0, 6);
        data.copy(frame.srcMAC, 0, 6, 12);
        data.copy(frame.typeLength, 0, 12, 14);
        data.copy(frame.data, 0, 14, data.length - 4);
        return frame;
    }
}