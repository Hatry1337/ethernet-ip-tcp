export enum HardwareTYPE {
    Ethernet = 0x0001,
}

export enum ProtocolTYPE {
    IP = 0x0800,
}

export enum ARP_OP {
    Request = 0x0001,
    Response = 0x0002,
}

export class ARPPacket {
    constructor(public hType: HardwareTYPE,
                public pType: ProtocolTYPE,
                public hLen: number,
                public pLen: number,
                public oper: ARP_OP ,
                public senderHardwareADR: Buffer,
                public senderProtoADR: Buffer,
                public targetHardwareADR: Buffer,
                public targetProtoADR: Buffer) {

    }

    public pack() {
        let totalLen = 8 + this.pLen * 2 + this.hLen * 2;
        let buff = Buffer.alloc(totalLen);
        buff.writeUint16BE(this.hType);
        buff.writeUint16BE(this.pType, 2);
        buff.writeUint8(this.hLen, 4);
        buff.writeUint8(this.pLen, 5);
        buff.writeUint16BE(this.oper, 6);
        this.senderHardwareADR.copy(buff, 8);
        this.senderProtoADR.copy(buff, 8 + this.hLen);
        this.targetHardwareADR.copy(buff, 8 + this.hLen + this.pLen);
        this.targetProtoADR.copy(buff, 8 + this.hLen * 2 + this.pLen);

        return buff;
    }

    public static unpack(data: Buffer) {
        let hType = data.readUint16BE();
        let pType = data.readUint16BE(2);
        let hLen = data.readUInt8(4);
        let pLen = data.readUInt8(5);
        let oper = data.readUint16BE(6);

        let senderHardwareADR = Buffer.alloc(hLen);
        let senderProtoADR = Buffer.alloc(pLen);
        let targetHardwareADR = Buffer.alloc(hLen);
        let targetProtoADR = Buffer.alloc(pLen);

        data.copy(senderHardwareADR, 0, 8);
        data.copy(senderProtoADR, 0, 8 + hLen);
        data.copy(targetHardwareADR, 0, 8 + hLen + pLen);
        data.copy(targetProtoADR, 0, 8 + hLen * 2 + pLen);

        return new ARPPacket(   hType, pType, hLen, pLen, oper,
                                senderHardwareADR, senderProtoADR,
                                targetHardwareADR, targetProtoADR   );
    }
}