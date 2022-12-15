import EventEmitter from "events";
import { IPv4Packet } from "./IPv4Packet";
import InternetPacketIO from "./InternetPacketIO";

declare interface InternetProtocolModule {
    //on(event: "packet", callback: (packet: IPv4Packet) => void): this;
}

class InternetProtocolModule extends EventEmitter {
    public input: InternetPacketIO = new InternetPacketIO();
    public output: InternetPacketIO = new InternetPacketIO();

    constructor(public maxTransmissionUnit: number) {
        super();
        //this.input.on("packet", this.handleInputPacket.bind(this));

        this.output.useMiddleware((packet, next) => {
            if(packet.length > this.maxTransmissionUnit){
                if(packet.flags.doNotFragment) return;

                let packets = InternetProtocolModule.splitPacket(this.maxTransmissionUnit, packet);
                for(let p of packets) {
                    this.output.write(p);
                }

                return;
            } else {
                next();
                return packet;
            }
        });
    }

    public sendPacket(packet: IPv4Packet) {
        this.output.write(packet);
    }

    public static splitPacket(maxLen: number, packet: IPv4Packet) {
        let arr: IPv4Packet[] = [];

        if(packet.length <= maxLen) {
            arr.push(packet);
            return arr;
        }

        let size1 = maxLen - (packet.headerLen * 4);
        while(size1 % 8 !== 0) {
            size1--;
        }

        let pack1 = packet.clone();
        pack1.flags.moreFragments = 1;
        pack1.data = Buffer.alloc(size1);
        packet.data.copy(pack1.data, 0, 0, size1);

        let pack2 = packet.clone();
        pack2.flags.moreFragments = 0;
        pack2.fragOffset = size1;
        pack2.data = Buffer.alloc(packet.data.length - size1);
        packet.data.copy(pack2.data, 0, size1);

        arr.push(pack1, pack2);
        return arr;
    }
}

export default InternetProtocolModule;