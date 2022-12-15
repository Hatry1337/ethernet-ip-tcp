import { EthernetFrame } from "./EthernetFrame";
import * as stream from "stream";
import EventEmitter from "events";
import { EthernetCable } from "./EthernetCable";

declare interface EthernetPort {
    on(event: "data", callback: (raw: Buffer) => void): this;
    on(event: "frameAny", callback: (frame: EthernetFrame, raw: Buffer) => void): this;
    on(event: "frame", callback: (frame: EthernetFrame, raw: Buffer) => void): this;
}

class EthernetPort extends EventEmitter {
    public cable?: EthernetCable;

    public txStream: stream.PassThrough = new stream.PassThrough();
    public rxStream: stream.PassThrough = new stream.PassThrough();

    public constructor(public MAC: Buffer) {
        super();

        this.rxStream.on("data", this.handleData.bind(this));
    }

    private handleData(data: Buffer) {
        this.emit("data", data);

        let frame: EthernetFrame;
        try {
            frame = EthernetFrame.unpack(data);
        } catch (e) {
            return console.log("Invalid data on port", this.MAC);
        }

        this.emit("frameAny", frame, data);

        if(!frame.dstMAC.equals(this.MAC)) {
            return;
        }

        this.emit("frame", frame, data);
    }

    public isUp(): boolean {
        let isUp = true;

        if(!this.cable?.isConnected()) isUp = false;
        if(this.rxStream.closed) isUp = false;
        if(this.txStream.closed) isUp = false;

        return isUp;
    }

    public isConnected(): boolean {
        return this.cable?.isConnected() ?? false;
    }

    public sendFrame(frame: EthernetFrame) {
        if(!this.isUp()){
            throw new Error("Link is down.");
        }
        if(frame.dstMAC.length !== 6) {
            throw new Error("Invalid dstMAC length.");
        }
        if(frame.srcMAC.length !== 6) {
            throw new Error("Invalid srcMAC length.");
        }
        if(frame.typeLength.length !== 2) {
            throw new Error("Invalid typeLength length.");
        }
        if(6 + 6 + 2 + frame.data.length > 1514){
            throw new Error("Frame length is too long.")
        }
        this.txStream.write(frame.pack());
    }

    public sendRawData(data: Buffer) {
        if(!this.isUp()){
            throw new Error("Link is down.");
        }
        this.txStream.write(data);
    }
}

export default EthernetPort;