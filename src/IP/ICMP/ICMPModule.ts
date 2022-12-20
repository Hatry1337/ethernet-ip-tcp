import PacketIO from "../../PacketIO";
import { ICMP_DstUnreachable_Code, ICMP_TimeExceeded_Code, ICMP_TYPE, ICMPPacket, ICMPPacketEcho } from "./ICMPPacket";
import { InternetProtocols, IPv4Packet } from "../IPv4Packet";

export class ICMPModule {
    //Incoming packets MUST be written here
    public input: PacketIO<IPv4Packet> = new PacketIO();
    //Outgoing packets WILL BE written here
    public output: PacketIO<IPv4Packet> = new PacketIO();

    constructor() {
        this.input.on("packet", this.handleInputPacket.bind(this));
    }

    private handleInputPacket(packet: IPv4Packet) {
        if(packet.proto !== InternetProtocols.ICMP) {
            return;
        }
        let icmp = ICMPPacket.unpackAuto(packet.data);

        if(icmp.isEcho() && !icmp.isReply) {
            let rsp = new ICMPPacketEcho(0, icmp.identifier, icmp.seqNumber, icmp.data, true);
            this.output.write(new IPv4Packet(
                Math.abs(Math.floor(Math.random() * 1000)),
                InternetProtocols.ICMP, packet.dstAddr, packet.srcAddr,
                rsp.pack()
            ));
            return;
        }
    }

    public sendDstUnreachableMessage(srcIpAddr: Buffer, dstIpAddr: Buffer, code: ICMP_DstUnreachable_Code, ipPacketPiece: Buffer) {
        let message = new ICMPPacket(ICMP_TYPE.DstUnreachable, code, ipPacketPiece);
        this.output.write(new IPv4Packet(
            Math.abs(Math.floor(Math.random() * 1000)),
            InternetProtocols.ICMP, srcIpAddr, dstIpAddr,
            message.pack()
        ));
    }

    public sendTimeExceedMessage(srcIpAddr: Buffer, dstIpAddr: Buffer, code: ICMP_TimeExceeded_Code, ipPacketPiece: Buffer) {
        let message = new ICMPPacket(ICMP_TYPE.TimeExceeded, code, ipPacketPiece);
        this.output.write(new IPv4Packet(
            Math.abs(Math.floor(Math.random() * 1000)),
            InternetProtocols.ICMP, srcIpAddr, dstIpAddr,
            message.pack()
        ));
    }

    public sendEchoMessage(srcIpAddr: Buffer, dstIpAddr: Buffer, icmpData: Buffer, code: number = 0, identifier: number = 0, seqNumber: number = 0) {
        let req = new ICMPPacketEcho(code, identifier, seqNumber, icmpData, false);
        this.output.write(new IPv4Packet(
            Math.abs(Math.floor(Math.random() * 1000)),
            InternetProtocols.ICMP, srcIpAddr, dstIpAddr,
            req.pack()
        ));
    }
}