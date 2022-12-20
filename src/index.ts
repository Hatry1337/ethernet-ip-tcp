import fs from "fs";
import { PCAPDump } from "./PCAPDump";
import { EthernetCable } from "./Ethernet/EthernetCable";
import { InternetProtocols, IPv4Packet } from "./IP/IPv4Packet";
import { UDPPacket } from "./UDP/UDPPacket";
import { Host } from "./Host";
import { EthernetFrame } from "./Ethernet/EthernetFrame";

const wsharkout = fs.createWriteStream('/var/run/wsharkout');

let host1 = new Host(Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6]), Buffer.from([ 192, 168, 1, 5 ]));
let host2 = new Host(Buffer.from([0x6, 0x5, 0x4, 0x3, 0x2, 0x1]), Buffer.from([ 192, 168, 1, 6 ]));

EthernetCable.connect(host1.eth0, host2.eth0);

host1.eth0.txStream.on("data", (data) => {
    console.log("[HOST1-TX]", EthernetFrame.unpack(data));
    console.log(data, "\n");
    PCAPDump.dumpData(data, wsharkout);
});

host1.eth0.rxStream.on("data", (data) => {
    console.log("[HOST1-RX]", EthernetFrame.unpack(data));
    console.log(data, "\n");
    PCAPDump.dumpData(data, wsharkout);
});

setInterval(async () => {
    let ippack = new IPv4Packet(228,
        InternetProtocols.UDP,
        host1.ipModule.ipAddr,
        host2.ipModule.ipAddr,
        new UDPPacket(0, 10, Buffer.allocUnsafe(2000)).pack()
    );

    host1.sendIPv4Packet(ippack);
}, 1000);


wsharkout.on("open", () => {
    wsharkout.write(PCAPDump.createSectionHeader());
    wsharkout.write(PCAPDump.createInterfaceDescBlock());
});
wsharkout.on("error", (e) => {
    console.log(e);
});