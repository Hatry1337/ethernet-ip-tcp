export enum EtherType {
    IPv4 = 0x0800,
    ARP = 0x0806
}

export class EthernetFrame {
    constructor(public dstMAC: Buffer,
                public srcMAC: Buffer,
                public typeLength: Buffer,
                public data: Buffer) {
    }

    public pack() {
        return Buffer.concat([ this.dstMAC, this.srcMAC, this.typeLength, this.data ]);
    }

    public static unpack(data: Buffer) {
        let dstMAC = Buffer.alloc(6);
        let srcMAC = Buffer.alloc(6);
        let typeLength = Buffer.alloc(2);
        let body = Buffer.alloc(data.length - 14);

        data.copy(dstMAC, 0, 0, 6);
        data.copy(srcMAC, 0, 6, 12);
        data.copy(typeLength, 0, 12, 14);
        data.copy(body, 0, 14);

        return new EthernetFrame(dstMAC, srcMAC, typeLength, body);
    }
}