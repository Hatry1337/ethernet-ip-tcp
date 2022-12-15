export interface IPv4Flags {
    reserved: 0 | 1;
    doNotFragment: 0 | 1;
    moreFragments: 0 | 1;
}

export enum InternetProtocols {
    ICMP = 1,
    TCP = 6,
    UDP = 17
}

export class IPv4Packet {
    /** 4bit uint */
    public readonly version: number = 4;
    /** 4bit uint */
    public readonly headerLen: number = 5;

    /** 4bit */
    public DSCP_CN: number = 0b00000000;

    /** 1bit flags x3 */
    public flags: IPv4Flags = {
        reserved: 0,
        doNotFragment: 0,
        moreFragments: 0,
    }

    //** 13bit uint */
    public fragOffset: number = 0;

    /** 8bit uint */
    public TTL: number = 64;

    /** 16bit uint */
    public headerChecksum: number = 0;

    /** 16bit uint */
    public id: number;

    /** 8bit uint */
    public proto: InternetProtocols;

    /** 32bit uint */
    public srcAddr: Buffer;

    /** 32bit uint */
    public dstAddr: Buffer;

    public data: Buffer;

    constructor(id: number, proto: InternetProtocols, srcAddr: Buffer, dstAddr: Buffer, data: Buffer) {
        this.id = id;
        this.proto = proto;
        this.srcAddr = srcAddr;
        this.dstAddr = dstAddr;
        this.data = data;
    }

    get length() {
        return this.headerLen * 4 + this.data.length;
    }

    public packHeader() {
        let buff = Buffer.alloc(this.headerLen * 4);

        buff.writeUInt8(this.version << 4 | this.headerLen);
        buff.writeUInt8(this.DSCP_CN, 1);
        buff.writeUint16BE(this.length, 2);
        buff.writeUint16BE(this.id, 4);

        let f = this.flags.reserved << 2 | this.flags.doNotFragment << 1 | this.flags.moreFragments;

        //2^13 - 1 = 8191 = 13 bit uint.
        if(this.fragOffset > 8191 || this.fragOffset < 0) {
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

    public pack(csumCalc: boolean = true) {
        let buff = Buffer.alloc(this.headerLen * 4 + this.data.length);

        let hpack = this.packHeader();
        if(csumCalc){
            this.headerChecksum = IPv4Packet.calcChecksum(hpack);
            hpack.writeUint16BE(this.headerChecksum, 10);
        }

        hpack.copy(buff);
        this.data.copy(buff, this.headerLen * 4);

        return buff;
    }

    public static calcChecksum(data: Buffer) {
        let sum = 0;
        for(let i = 0; i < data.length; i += 2)
        {
            let digit = (data[i] << 8) + data[i + 1];
            sum = (sum + digit) % 65535;
        }
        return (~sum) & 0xFFFF;
    }

    public clone() {
        let srcAddr = Buffer.alloc(6);
        let dstAddr = Buffer.alloc(6);
        let data = Buffer.alloc(this.data.length);

        this.srcAddr.copy(srcAddr);
        this.dstAddr.copy(dstAddr);
        this.data.copy(data);

        let packetCopy = new IPv4Packet(this.id, this.proto, srcAddr, dstAddr, data);
        packetCopy.DSCP_CN = this.DSCP_CN;
        packetCopy.flags = {
            reserved: this.flags.reserved,
            doNotFragment: this.flags.doNotFragment,
            moreFragments: this.flags.moreFragments
        }
        packetCopy.fragOffset = this.fragOffset;
        packetCopy.TTL = this.TTL;
        packetCopy.headerChecksum = this.headerChecksum;

        return packetCopy;
    }
}