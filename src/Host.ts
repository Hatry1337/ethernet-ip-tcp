import EthernetPort from "./Ethernet/EthernetPort";
import InternetProtocolModule from "./IP/InternetProtocolModule";
import { IPv4Packet } from "./IP/IPv4Packet";
import { EthernetFrame, EtherType } from "./Ethernet/EthernetFrame";
import { ARPModule } from "./ARP/ARPModule";
import { ARPPacket } from "./ARP/ARPPacket";

export class Host {
    public eth0: EthernetPort;
    public ipModule: InternetProtocolModule;
    public arpModule: ARPModule;

    private ethernetQueue: EthernetFrame[] = [];
    private ipQueue: IPv4Packet[] = [];

    private queueTimer: NodeJS.Timeout;

    constructor(eth0MAC: Buffer, ipAddr = Buffer.alloc(4)) {
        this.eth0 = new EthernetPort(eth0MAC);
        this.ipModule = new InternetProtocolModule(this, ipAddr, 1500, 30000);
        this.arpModule = new ARPModule(this);

        this.ipModule.output.on("packet", async (packet) => {
            let arpCache = await this.arpModule.getHwAddress(packet.dstAddr);

            this.sendEthernetFrame(new EthernetFrame(
                arpCache.hardwareAddr,
                this.eth0.MAC,
                Buffer.from([ 0x08, 0x00 ]),
                packet.pack())
            );
        });

        this.arpModule.output.on("packet", async (packet) => {
            this.sendEthernetFrame(new EthernetFrame(
                packet.targetHardwareADR,
                this.eth0.MAC,
                Buffer.from([ 0x08, 0x06 ]),
                packet.pack()
            ));
        });

        this.eth0.on("frame", async (frame) => {
            if(frame.typeLength.readUint16BE() === EtherType.IPv4) {
                let packet = IPv4Packet.unpack(frame.data);
                this.ipModule.input.write(packet);
            }

            if(frame.typeLength.readUint16BE() === EtherType.ARP) {
                let arpPacket = ARPPacket.unpack(frame.data);
                this.arpModule.input.write(arpPacket);
            }
        });

        this.queueTimer = setInterval(() => {
            if(this.ipQueue.length !== 0) {
                let packet = this.ipQueue.pop()!;
                this.ipModule.sendPacket(packet);
            }

            if(this.ethernetQueue.length !== 0) {
                let frame = this.ethernetQueue.pop()!;
                this.eth0.sendFrame(frame);
            }
        }, 10);
    }

    public sendIPv4Packet(packet: IPv4Packet) {
        this.ipQueue.push(packet);
    }

    public sendEthernetFrame(frame: EthernetFrame) {
        this.ethernetQueue.push(frame);
    }
}