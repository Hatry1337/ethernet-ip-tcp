import { IPv4Packet } from "./IPv4Packet";
import EventEmitter from "events";

export type InternetPacketIOMiddlewareCallback = (packet: IPv4Packet, next: () => void) => IPv4Packet | undefined;

interface InternetPacketIOMiddleware {
    callback: InternetPacketIOMiddlewareCallback;
    index: number;
}

declare interface InternetPacketIO {
    on(event: "packetRaw", callback: (packet: IPv4Packet) => void): this;
    on(event: "packet", callback: (packet: IPv4Packet) => void): this;
}

class InternetPacketIO extends EventEmitter {
    private middlewareStack: InternetPacketIOMiddleware[] = [];

    public write(packet: IPv4Packet) {
        this.emit("packetRaw", packet);

        for(let m of this.middlewareStack) {
            let next: boolean = false;
            let packet_new = m.callback( packet, () => { next = true });
            if(!packet_new) return;
            packet = packet_new;
            if(!next) break;
        }

        this.emit("packet", packet);
    }

    public useMiddleware(callback: InternetPacketIOMiddlewareCallback) {
        this.middlewareStack.push({
            callback,
            index: this.middlewareStack.length
        });
    }
}

export default InternetPacketIO;