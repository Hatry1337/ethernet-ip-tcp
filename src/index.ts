import { EthernetFrame } from "./Ethernet/EthernetFrame";
import EthernetPort from "./Ethernet/EthernetPort";
import fs from "fs";
import { PCAPDump } from "./PCAPDump";
import { EthernetCable } from "./Ethernet/EthernetCable";
import { IPProtocols, IPv4Packet } from "./IP/IPv4Packet";

const wsharkout = fs.createWriteStream('./wsharkout');

let port1 = new EthernetPort(Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]));
let port2 = new EthernetPort(Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]));

EthernetCable.connect(port1, port2);

port2.on("frameAny", (frame, raw) => {
    console.log(raw);
    console.log(frame);
    PCAPDump.dumpData(raw, wsharkout);
});

setInterval(() => {
    let ippack = new IPv4Packet(228, IPProtocols.ICMP, Buffer.from([10, 8, 0, 1]), Buffer.from([10, 8, 0, 2]), Buffer.alloc(0));
    port1.sendFrame(new EthernetFrame(  Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]),
        Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]),
        Buffer.from([ 0x08, 0x00 ]),
        ippack.packHeader()));
        //Buffer.from("00010800060400011c740d829164c0a80d01000000000000c0a80d68", "hex")));
}, 1000);

wsharkout.on("open", () => {
    wsharkout.write(PCAPDump.createSectionHeader());
    wsharkout.write(PCAPDump.createInterfaceDescBlock());
});
wsharkout.on("error", (e) => {
    console.log(e);
});