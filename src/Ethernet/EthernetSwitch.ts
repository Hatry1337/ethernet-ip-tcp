import EthernetPort from "./EthernetPort";
import { EthernetFrame } from "./EthernetFrame";

export class EthernetSwitch {
    public ports: EthernetPort[];
    private portAddrMatrix: Map<Buffer, number> = new Map();

    constructor(ports: number) {
        this.ports = [];
        for(let i = 0; i < ports; i++) {
            let p = new EthernetPort(Buffer.alloc(6));
            p.on("frameAny", (frame, raw) => {
                this.handlePortData(i, frame, raw);
            });
            this.ports.push();
        }
    }

    private handlePortData(port: number, frame: EthernetFrame, raw: Buffer) {
        this.portAddrMatrix.set(frame.srcMAC, port);

        let dstPort = this.portAddrMatrix.get(frame.dstMAC);

        if(dstPort === undefined) {
            for (let p of this.ports) {
                p.txStream.write(raw);
            }
        } else {
            this.ports[dstPort].txStream.write(raw);
        }
    }
}