import EthernetPort from "./Ethernet/EthernetPort";

export class Host {
    public eth0: EthernetPort;

    constructor(eth0MAC: Buffer, public ipAddr = Buffer.alloc(4)) {
        this.eth0 = new EthernetPort(eth0MAC);
    }
}