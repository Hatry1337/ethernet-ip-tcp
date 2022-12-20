import EventEmitter from "events";

export type InternetPacketIOMiddlewareCallback<T, D = Buffer> = (packet: T, next: () => void, extraDst?: D) => T | undefined;

interface InternetPacketIOMiddleware<T, D = Buffer> {
    callback: InternetPacketIOMiddlewareCallback<T, D>;
    index: number;
}

declare interface PacketIO<T, D = Buffer> {
    on(event: "packetDirect", callback: (packet: T, extraDst?: D) => void): this;
    on(event: "packet", callback: (packet: T, extraDst?: D) => void): this;
}

class PacketIO<T, D = Buffer> extends EventEmitter {
    private middlewareStack: InternetPacketIOMiddleware<T, D>[] = [];

    public write(packet: T, extraDst?: D) {
        this.emit("packetDirect", packet, extraDst);

        for(let m of this.middlewareStack) {
            let next: boolean = false;
            let packet_new = m.callback( packet, () => { next = true }, extraDst);
            if(!packet_new) return;
            packet = packet_new;
            if(!next) break;
        }

        this.emit("packet", packet, extraDst);
    }

    public useMiddleware(callback: InternetPacketIOMiddlewareCallback<T, D>) {
        this.middlewareStack.push({
            callback,
            index: this.middlewareStack.length
        });
    }
}

export default PacketIO;