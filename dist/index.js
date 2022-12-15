"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EthernetFrame_1 = require("./Ethernet/EthernetFrame");
const EthernetPort_1 = __importDefault(require("./Ethernet/EthernetPort"));
const fs_1 = __importDefault(require("fs"));
const PCAPDump_1 = require("./PCAPDump");
const EthernetCable_1 = require("./Ethernet/EthernetCable");
const IPv4Packet_1 = require("./IP/IPv4Packet");
const wsharkout = fs_1.default.createWriteStream('./wsharkout');
let port1 = new EthernetPort_1.default(Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]));
let port2 = new EthernetPort_1.default(Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]));
EthernetCable_1.EthernetCable.connect(port1, port2);
port2.on("frameAny", (frame, raw) => {
    console.log(raw);
    console.log(frame);
    PCAPDump_1.PCAPDump.dumpData(raw, wsharkout);
});
setInterval(() => {
    let ippack = new IPv4Packet_1.IPv4Packet(228, IPv4Packet_1.IPProtocols.ICMP, Buffer.from([10, 8, 0, 1]), Buffer.from([10, 8, 0, 2]), Buffer.alloc(0));
    port1.sendFrame(new EthernetFrame_1.EthernetFrame(Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]), Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]), Buffer.from([0x08, 0x00]), ippack.packHeader()));
    //Buffer.from("00010800060400011c740d829164c0a80d01000000000000c0a80d68", "hex")));
}, 1000);
wsharkout.on("open", () => {
    wsharkout.write(PCAPDump_1.PCAPDump.createSectionHeader());
    wsharkout.write(PCAPDump_1.PCAPDump.createInterfaceDescBlock());
});
wsharkout.on("error", (e) => {
    console.log(e);
});
//# sourceMappingURL=index.js.map