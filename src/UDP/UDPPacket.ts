export class UDPPacket {
    /** 16 bit uint */
    public srcPort: number;
    /** 16 bit uint */
    public dstPort: number
    /** 16 bit uint */
    public checksum: number = 0

    constructor(srcPort: number = 0, dstPort: number, public data: Buffer) {
        this.srcPort = srcPort;
        this.dstPort = dstPort;
    }

    public pack() {
        let buff = Buffer.alloc(this.length);

        buff.writeUInt16BE(this.srcPort);
        buff.writeUInt16BE(this.dstPort, 2);
        buff.writeUInt16BE(this.length, 4);
        buff.writeUInt16BE(this.checksum, 6);

        this.data.copy(buff, 8);

        return buff;
    }

    get length() {
        return 8 + this.data.length;
    }

}