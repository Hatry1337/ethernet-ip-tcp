import EventEmitter from "events";
import { IPv4Packet } from "./IPv4Packet";
import PacketIO from "../PacketIO";
import { Host } from "../Host";
import { clearInterval } from "timers";

interface DataChunk {
    data: Buffer;
    offset: number;
}

interface PacketAccumulator {
    firstPacket?: IPv4Packet;
    chunks: DataChunk[];
    receivedDataLen: number;
    expectedDataLen: number;
    receptionTimestamp: number;
}

declare interface InternetProtocolModule {
    on(event: "packetChunk", callback: (packet: IPv4Packet) => void): this;
    on(event: "packet", callback: (packet: IPv4Packet) => void): this;
}

class InternetProtocolModule extends EventEmitter {
    //Incoming packets MUST be written here
    public input: PacketIO<IPv4Packet> = new PacketIO();
    //Outgoing packets WILL BE written here
    public output: PacketIO<IPv4Packet> = new PacketIO();

    private chunkedPacketsAccumulator: Map<string, PacketAccumulator> = new Map();
    private readonly lifetimeCheckInterval: NodeJS.Timeout;

    constructor(public host: Host, public ipAddr: Buffer, public maxTransmissionUnit: number = 1500, public chunkAccumulationTimeout: number = 30000) {
        super();
        this.input.on("packet", this.handleInputPacket.bind(this));

        this.output.useMiddleware((packet, next) => {
            if(packet.length > this.maxTransmissionUnit){
                // #TODO add ICMP response on packet voiding.
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

        this.lifetimeCheckInterval = setInterval(() => {
            let ts = new Date().getTime();

            // Cleanup packet accumulators if packet is not collected in time
            for(let e of this.chunkedPacketsAccumulator.entries()) {
                if(ts - e[1].receptionTimestamp >= this.chunkAccumulationTimeout) {
                    this.chunkedPacketsAccumulator.delete(e[0]);
                }
            }
        }, 10000);
    }

    public destroy() {
        clearInterval(this.lifetimeCheckInterval);
    }

    private handleInputPacket(packet: IPv4Packet) {
        // If packet is not fragmented just pass it to the event bus
        if (packet.flags.moreFragments === 0 && packet.fragOffset === 0) {
            this.emit("packet", packet);
            return;
        }

        this.emit("packetChunk", packet);

        let puid = packet.uid.toString("hex");
        let accumulator = this.chunkedPacketsAccumulator.get(puid);

        if (!accumulator) {
            accumulator = {
                chunks: [],
                receivedDataLen: 0,
                expectedDataLen: 0,
                receptionTimestamp: new Date().getTime()
            }
        }

        /*
            - FirstPacket   (MF == 1, FO == 0)
            - MiddlePacket  (MF == 1, FO != 0)
            - LastPacket    (MF == 0, FO != 0)
        */

        //Packet is a first chunk of chunked packet
        if (packet.flags.moreFragments === 1 && packet.fragOffset === 0) {
            accumulator.firstPacket = packet;
        } else {
            accumulator.chunks.push({
                offset: packet.fragOffset,
                data: packet.data
            });
        }

        //Packet is a last chunk of chunked packet
        if (packet.flags.moreFragments === 0 && packet.fragOffset !== 0) {
            accumulator.expectedDataLen = packet.fragOffset + packet.data.length;
        }

        accumulator.receivedDataLen += packet.data.length;

        if (accumulator.expectedDataLen !== 0 &&
            accumulator.receivedDataLen === accumulator.expectedDataLen) {

            let buff = Buffer.alloc(accumulator.receivedDataLen);

            let newPacket = accumulator.firstPacket!.clone();

            newPacket.data.copy(buff);
            for(let c of accumulator.chunks) {
                c.data.copy(buff, c.offset);
            }

            newPacket.data = buff;
            newPacket.fragOffset = 0;
            newPacket.flags.moreFragments = 0;

            this.chunkedPacketsAccumulator.delete(puid);
            this.emit("packet", newPacket);
            return;
        }

        this.chunkedPacketsAccumulator.set(puid, accumulator);
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