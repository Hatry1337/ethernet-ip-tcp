import { EthernetFrame } from "./Ethernet/EthernetFrame";
import EthernetPort from "./Ethernet/EthernetPort";
import fs from "fs";
import { PCAPDump } from "./PCAPDump";
import { EthernetCable } from "./Ethernet/EthernetCable";
import { InternetProtocols, IPv4Packet } from "./IP/IPv4Packet";
import InternetProtocolModule from "./IP/InternetProtocolModule";
import { UDPPacket } from "./UDP/UDPPacket";

const wsharkout = fs.createWriteStream('/var/run/wsharkout');

let port1 = new EthernetPort(Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]));
let port2 = new EthernetPort(Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]));

EthernetCable.connect(port1, port2);

port2.on("frameAny", (frame, raw) => {
    console.log(raw);
    console.log(frame);
    PCAPDump.dumpData(raw, wsharkout);
});

let ipmodule = new InternetProtocolModule(1500);

ipmodule.output.on("packet", packet => {
    port1.sendFrame(new EthernetFrame(  Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]),
        Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]),
        Buffer.from([ 0x08, 0x00 ]),
        packet.pack()));
})

setInterval(() => {
    let ippack = new IPv4Packet(228,
                                InternetProtocols.UDP,
                                Buffer.from([10, 8, 0, 1]),
                                Buffer.from([10, 8, 0, 2]),
                                new UDPPacket(0, 10, Buffer.allocUnsafe(2000)).pack()
    );

    ipmodule.sendPacket(ippack);
}, 1000);

wsharkout.on("open", () => {
    wsharkout.write(PCAPDump.createSectionHeader());
    wsharkout.write(PCAPDump.createInterfaceDescBlock());
});
wsharkout.on("error", (e) => {
    console.log(e);
});