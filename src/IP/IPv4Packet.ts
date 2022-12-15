export interface IPv4Flags {
    reserved: 0 | 1;
    doNotFragment: 0 | 1;
    hasFragments: 0 | 1;
}

export enum IPProtocols {
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
        hasFragments: 0,
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
    public proto: IPProtocols;

    /** 32bit uint */
    public srcAddr: Buffer;

    /** 32bit uint */
    public dstAddr: Buffer;

    public data: Buffer;

    constructor(id: number, proto: IPProtocols, srcAddr: Buffer, dstAddr: Buffer, data: Buffer) {
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

        let f = this.flags.reserved << 2 | this.flags.doNotFragment << 1 | this.flags.doNotFragment;

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
    /*
    public calcHeaderChecksum() {

            // Initialise the accumulator.
            let acc=0xffff;

            // Handle complete 16-bit blocks.
            for (size_t i=0;i+1<length;i+=2) {
                uint16_t word;
                memcpy(&word,data+i,2);
                acc+=ntohs(word);
                if (acc>0xffff) {
                    acc-=0xffff;
                }
            }

            // Handle any partial block at the end of the data.
            if (length&1) {
                uint16_t word=0;
                memcpy(&word,data+length-1,1);
                acc+=ntohs(word);
                if (acc>0xffff) {
                    acc-=0xffff;
                }
            }

            // Return the checksum in network byte order.
            return htons(~acc);
    }
    */
}