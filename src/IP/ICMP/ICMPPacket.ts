import { IPv4Packet } from "../IPv4Packet";

export enum ICMP_TYPE {
    DstUnreachable = 3,
    TimeExceeded = 11,
    ParamProblem = 12,
    SrcQuench = 4,
    Redirect = 5,
    Echo = 8,
    EchoReply = 0,
    Timestamp = 13,
    TimestampReply = 14,
    InfoRequest = 15,
    InfoReply = 16,
}

export enum ICMP_DstUnreachable_Code {
    NetUnreachable = 0,
    HostUnreachable = 1,
    ProtocolUnreachable = 2,
    PortUnreachable = 3,
    FragNeeded = 4,
    SrcRouteUnreachable = 5,
}

export enum ICMP_TimeExceeded_Code {
    TTLExceededInTransit = 0,
    FragReassemblyTimeExceeded = 1,
}

export enum ICMP_Redirect_Code {
    RedirectForNetwork = 0,
    RedirectForHost = 1,
    RedirectForTOSandNetwork = 2,
    RedirectForTOSandHost = 3,
}

export type ICMP_CODE = ICMP_DstUnreachable_Code | ICMP_TimeExceeded_Code | ICMP_Redirect_Code;

export class ICMPPacket {
    public csum: number = 0;

    constructor(public type: ICMP_TYPE, public code: ICMP_CODE, public data: Buffer) {

    }

    public static calcChecksum(data: Buffer) {
        return IPv4Packet.calcChecksum(data);
    }

    public packExtras() {
        return Buffer.alloc(4);
    }

    public pack() {
        let buff = Buffer.alloc(8 + this.data.length);

        buff.writeUint8(this.type);
        buff.writeUint8(this.code, 1);

        let extras = this.packExtras();
        extras.copy(buff, 4);

        this.data.copy(buff, 8);

        buff.writeUint16BE(ICMPPacket.calcChecksum(buff), 2);

        return buff;
    }

    public static unpack(data: Buffer) {
        let type = data.readUint8();
        let code = data.readUint8(1);

        let body = Buffer.alloc(data.length - 8);
        data.copy(body, 0, 8);

        let packet = new ICMPPacket(type, code, body);

        packet.csum =  data.readUint16BE(2);

        return packet;
    }

    public static unpackAuto(data: Buffer) {
        let base = ICMPPacket.unpack(data);

        let packetRef;
        switch (base.type) {
            case ICMP_TYPE.ParamProblem:
                packetRef = ICMPPacketParamProblem;
                break;

            case ICMP_TYPE.Redirect:
                packetRef = ICMPPacketRedirect;
                break;

            case ICMP_TYPE.Echo:
                packetRef = ICMPPacketEcho;
                break;

            case ICMP_TYPE.EchoReply:
                packetRef = ICMPPacketEcho;
                break;

            case ICMP_TYPE.Timestamp:
                packetRef = ICMPPacketTimestamp;
                break;

            case ICMP_TYPE.TimestampReply:
                packetRef = ICMPPacketTimestamp;
                break;

            case ICMP_TYPE.InfoRequest:
                packetRef = ICMPPacketInfoRequest;
                break;

            case ICMP_TYPE.InfoReply:
                packetRef = ICMPPacketInfoRequest;
                break;

            default:
                packetRef = ICMPPacket;
                break;
        }

        return packetRef.unpack(data);
    }

    // Type guards
    public isParamProblem(): this is ICMPPacketParamProblem {
        return this.type === ICMP_TYPE.ParamProblem;
    }
    public isRedirect(): this is ICMPPacketRedirect {
        return this.type === ICMP_TYPE.Redirect;
    }
    public isEcho(): this is ICMPPacketEcho {
        return this.type === ICMP_TYPE.Echo || this.type === ICMP_TYPE.EchoReply;
    }
    public isTimestamp(): this is ICMPPacketTimestamp {
        return this.type === ICMP_TYPE.Timestamp || this.type === ICMP_TYPE.TimestampReply;
    }
    public isInfo(): this is ICMPPacketInfoRequest {
        return this.type === ICMP_TYPE.InfoRequest || this.type === ICMP_TYPE.InfoReply;
    }
}

export class ICMPPacketParamProblem extends ICMPPacket {
    constructor(code: number, public pointer: number, data: Buffer) {
        super(ICMP_TYPE.ParamProblem, code, data);
    }

    public override packExtras(): Buffer {
        let buff = Buffer.alloc(4);
        buff.writeUint8(this.pointer);
        return buff;
    }

    public static override unpack(data: Buffer) {
        let base = super.unpack(data);
        return new ICMPPacketParamProblem(base.code, data.readUint8(4), base.data);
    }
}

export class ICMPPacketRedirect extends ICMPPacket {
    constructor(code: ICMP_Redirect_Code, public gatewayIpAddr: Buffer, data: Buffer) {
        super(ICMP_TYPE.Redirect, code, data);
    }

    public override packExtras(): Buffer {
        let buff = Buffer.alloc(4);
        this.gatewayIpAddr.copy(buff);
        return buff;
    }

    public static override unpack(data: Buffer) {
        let base = super.unpack(data);
        let gatewayAddress = Buffer.alloc(4);
        data.copy(gatewayAddress, 0, 4);
        return new ICMPPacketRedirect(base.code as number, gatewayAddress, base.data);
    }
}

export class ICMPPacketEcho extends ICMPPacket {
    constructor(code: number, public identifier: number, public seqNumber: number, data: Buffer, public isReply: boolean) {
        super(isReply ? ICMP_TYPE.EchoReply : ICMP_TYPE.Echo, code, data);
    }

    public override packExtras(): Buffer {
        let buff = Buffer.alloc(4);
        buff.writeUint16BE(this.identifier);
        buff.writeUint16BE(this.seqNumber, 2);
        return buff;
    }

    public static override unpack(data: Buffer) {
        let base = super.unpack(data);
        let identifier = data.readUInt16BE(4);
        let seqNumber = data.readUint16BE(6);

        return new ICMPPacketEcho(  base.code as number, identifier, seqNumber,
                                    base.data, base.type === ICMP_TYPE.EchoReply );
    }
}

export class ICMPPacketTimestamp extends ICMPPacket {
    constructor( code: number,
                 public identifier: number, public seqNumber: number,
                 public originateTimestamp: number,
                 public receiveTimestamp: number,
                 public transmitTimestamp: number, public isReply: boolean ) {
        super(isReply ? ICMP_TYPE.TimestampReply : ICMP_TYPE.Timestamp, code, Buffer.alloc(12));
    }

    public override pack() {
        this.data.writeUInt32BE(this.originateTimestamp);
        this.data.writeUInt32BE(this.receiveTimestamp, 4);
        this.data.writeUInt32BE(this.transmitTimestamp, 8);

        return super.pack();
    }

    public override packExtras(): Buffer {
        let buff = Buffer.alloc(4);
        buff.writeUint16BE(this.identifier);
        buff.writeUint16BE(this.seqNumber, 2);
        return buff;
    }

    public static override unpack(data: Buffer) {
        let base = super.unpack(data);
        let identifier = data.readUInt16BE(4);
        let seqNumber = data.readUint16BE(6);
        let originateTimestamp = data.readUInt32BE(8);
        let receiveTimestamp = data.readUInt32BE(12);
        let transmitTimestamp = data.readUInt32BE(16);

        return new ICMPPacketTimestamp( base.code as number, identifier, seqNumber,
                                        originateTimestamp, receiveTimestamp, transmitTimestamp,
                                        base.type === ICMP_TYPE.TimestampReply );
    }
}

export class ICMPPacketInfoRequest extends ICMPPacket {
    constructor(code: number, public identifier: number, public seqNumber: number, public isReply: boolean) {
        super(isReply ? ICMP_TYPE.InfoReply : ICMP_TYPE.InfoRequest, code, Buffer.alloc(0));
    }

    public override packExtras(): Buffer {
        let buff = Buffer.alloc(4);
        buff.writeUint16BE(this.identifier);
        buff.writeUint16BE(this.seqNumber, 2);
        return buff;
    }

    public static override unpack(data: Buffer) {
        let base = super.unpack(data);
        let identifier = data.readUInt16BE(4);
        let seqNumber = data.readUint16BE(6);

        return new ICMPPacketInfoRequest(   base.code as number, identifier, seqNumber,
                                            base.type === ICMP_TYPE.EchoReply   );
    }
}