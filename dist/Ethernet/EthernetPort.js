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
    isUp() {
        var _a;
        let isUp = true;
        if (!((_a = this.cable) === null || _a === void 0 ? void 0 : _a.isConnected()))
            isUp = false;
        if (this.rxStream.closed)
            isUp = false;
        if (this.txStream.closed)
            isUp = false;
        return isUp;
    }
    isConnected() {
        var _a, _b;
        return (_b = (_a = this.cable) === null || _a === void 0 ? void 0 : _a.isConnected()) !== null && _b !== void 0 ? _b : false;
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