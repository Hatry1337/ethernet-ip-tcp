"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EthernetFrame_1 = require("./EthernetFrame");
const stream = __importStar(require("stream"));
const events_1 = __importDefault(require("events"));
class EthernetPort extends events_1.default {
    constructor(MAC) {
        super();
        this.MAC = MAC;
        this.txStream = new stream.PassThrough();
        this.rxStream = new stream.PassThrough();
        this.rxStream.on("data", this.handleData.bind(this));
    }
    handleData(data) {
        this.emit("data", data);
        let frame;
        try {
            frame = EthernetFrame_1.EthernetFrame.unpack(data);
        }
        catch (e) {
            return console.log("Invalid data on port", this.MAC);
        }
        this.emit("frameAny", frame, data);
        if (!frame.dstMAC.equals(this.MAC)) {
            return;
        }
        this.emit("frame", frame, data);
    }
    connect(port) {
        if (this.connectedPort) {
            throw new Error("EALRDCONN: You should disconnect this port before connect it.");
        }
        this.connectedPort = port;
        port.connectedPort = this;
        this.txStream.pipe(port.rxStream);
        port.txStream.pipe(this.rxStream);
    }
    disconnect() {
        if (this.connectedPort) {
            this.txStream.unpipe(this.connectedPort.rxStream);
            this.connectedPort.txStream.unpipe(this.rxStream);
            this.connectedPort.connectedPort = undefined;
            this.connectedPort = undefined;
        }
    }
    isUp() {
        let isUp = true;
        if (!this.connectedPort)
            isUp = false;
        if (this.rxStream.closed)
            isUp = false;
        if (this.txStream.closed)
            isUp = false;
        return isUp;
    }
    isConnected() {
        return !!this.connectedPort;
    }
    sendFrame(frame) {
        if (!this.isUp()) {
            throw new Error("Link is down.");
        }
        if (frame.dstMAC.length !== 6) {
            throw new Error("Invalid dstMAC length.");
        }
        if (frame.srcMAC.length !== 6) {
            throw new Error("Invalid srcMAC length.");
        }
        if (frame.typeLength.length !== 2) {
            throw new Error("Invalid typeLength length.");
        }
        if (6 + 6 + 2 + frame.data.length > 1514) {
            throw new Error("Frame length is too long.");
        }
        this.txStream.write(frame.pack());
    }
    sendRawData(data) {
        if (!this.isUp()) {
            throw new Error("Link is down.");
        }
        this.txStream.write(data);
    }
}
exports.default = EthernetPort;
//# sourceMappingURL=EthernetPort.js.map