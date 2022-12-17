import EventEmitter from "events";
import { IPv4Packet } from "./IPv4Packet";
import InternetPacketIO from "./InternetPacketIO";

interface DataChunk {
    data: Buffer;
    offset: number;
}

interface PacketAccumulator {
    firstPacket?: IPv4Packet;
    chunks: DataChunk[];
    receivedDataLen: number;
    timeout: NodeJS.Timeout;
}

declare interface InternetProtocolModule {
    on(event: "packetChunk", callback: (packet: IPv4Packet) => void): this;
    on(event: "packet", callback: (packet: IPv4Packet) => void): this;
}

class InternetProtocolModule extends EventEmitter {
    public input: InternetPacketIO = new InternetPacketIO();
    public output: InternetPacketIO = new InternetPacketIO();

    private chunkedPacketsAccumulator: Map<string, PacketAccumulator> = new Map();

    constructor(public maxTransmissionUnit: number, public chunkAccumulationTimeout: number) {
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
    }

    private handleInputPacket(packet: IPv4Packet) {
        if(packet.flags.moreFragments === 1) {
            this.emit("packetChunk", packet);

            // If packet is part of chunked packet store or update data in accumulator
            if(packet.flags.moreFragments) {
                let puid = packet.uid.toString("hex");
                let accumulator = this.chunkedPacketsAccumulator.get(puid);

                if(!accumulator) {
                    if(packet.fragOffset === 0) {
                        accumulator = {
                            firstPacket: packet,
                            chunks: [],
                            receivedDataLen: packet.data.length,
                            timeout: setTimeout(() => {}, this.chunkAccumulationTimeout)
                        }
                    } else {
                        accumulator = {
                            chunks: [ {
                                offset: packet.fragOffset,
                                data: packet.data
                            } ],
                            receivedDataLen: packet.data.length,
                            timeout: setTimeout(() => {}, this.chunkAccumulationTimeout)
                        }
                    }
                    this.chunkedPacketsAccumulator.set(puid, accumulator);
                    return;
                }


                /* #TODO Work In Progress.
                     
                let buff = Buffer.alloc(accpack.data.length + packet.data.length);
                accpack.data.copy(buff);
                packet.data.copy(buff, packet.fragOffset * 8);

                accpack.data = buff;
                this.chunkedPacketsAccumulator.set(puid, accpack);
                return;
                */
            }

            // If packet is the latest chunk of chunked packet finally assemble packet and emit "packet" event
            if(packet.fragOffset !== 0) {
                let puid = packet.uid.toString("hex");
                let accpack = this.chunkedPacketsAccumulator.get(puid);


            }

        }
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