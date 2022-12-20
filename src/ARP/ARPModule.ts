import { ARP_OP, ARPPacket, HardwareTYPE, ProtocolTYPE } from "./ARPPacket";
import { Host } from "../Host";
import { clearInterval } from "timers";
import PacketIO from "../PacketIO";

interface ARPCacheEntry {
    hardwareAddr: Buffer;
    protocolAddr: Buffer;
    timestamp: number;
}

interface ARPPendingRequest {
    protoAddr: Buffer;
    timestamp: number;
    callback: (error: string | undefined, cacheEntry?: ARPCacheEntry) => void;
}

export class ARPModule {
    //Incoming packets MUST be written here
    public input: PacketIO<ARPPacket> = new PacketIO();
    //Outgoing packets WILL BE written here
    public output: PacketIO<ARPPacket> = new PacketIO();

    private arpCache: Map<string, ARPCacheEntry> = new Map();

    private pendingRequests: Map<string, ARPPendingRequest> = new Map();
    private readonly lifetimeCheckInterval: NodeJS.Timeout;

    constructor(public host: Host) {
        this.input.on("packet", this.handleInputPacket.bind(this));

        this.lifetimeCheckInterval = setInterval(() => {
            let ts = new Date().getTime();

            // ARP Cache cleanup
            for(let e of this.arpCache) {
                if(ts - e[1].timestamp >= 15000) {
                    this.arpCache.delete(e[0]);
                }
            }

            // Pending requests cleanup
            for(let e of this.pendingRequests.entries()) {
                if(ts - e[1].timestamp >= 15000) {
                    e[1].callback("ERESPONSETIMEOUT: ARP response timeout.");
                    this.pendingRequests.delete(e[0]);
                }
            }
        }, 5000);
    }

    public destroy() {
        clearInterval(this.lifetimeCheckInterval);
    }

    private handleInputPacket(arpPacket: ARPPacket) {
        // Save broadcasted requests to cache
        if( arpPacket.oper === ARP_OP.Request &&
            arpPacket.targetHardwareADR.equals(Buffer.from([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff ])) ) {

            this.setAddress(arpPacket.senderHardwareADR, arpPacket.senderProtoADR);
        }

        if(arpPacket.oper === ARP_OP.Request && arpPacket.targetProtoADR.equals(this.host.ipModule.ipAddr)) {
            let arpResponse = new ARPPacket(
                HardwareTYPE.Ethernet,
                ProtocolTYPE.IP,
                6, 4,
                ARP_OP.Response,
                this.host.eth0.MAC,
                this.host.ipModule.ipAddr,
                arpPacket.senderHardwareADR,
                arpPacket.senderProtoADR
            );

            this.output.write(arpResponse);
            return;
        }

        if(arpPacket.oper == ARP_OP.Response && arpPacket.targetProtoADR.equals(this.host.ipModule.ipAddr)) {
            let cacheEntry = this.setAddress(arpPacket.senderHardwareADR, arpPacket.senderProtoADR);

            let request = this.pendingRequests.get(arpPacket.senderProtoADR.toString("hex"));
            if(!request) return;

            request.callback(undefined, cacheEntry);
        }
    }

    public async getHwAddress(protoAddr: Buffer, retries: number = 2) {
        let protoStr = protoAddr.toString("hex");
        let cacheEntry = this.arpCache.get(protoStr);

        if(!cacheEntry) {
            for(let i = 0; i < retries; i++) {
                try {
                    cacheEntry = await this.requestHwAddress(protoAddr);
                    break;
                } catch (e) {

                }
            }
            if(!cacheEntry) {
                throw new Error(`Unable to resolve hardware address of "${protoAddr.toString("hex")}" after ${retries} retries.`)
            }
        }

        return cacheEntry;
    }

    public requestHwAddress(protoAddr: Buffer) {
        return new Promise<ARPCacheEntry>((resolve, reject) => {
            let arp = new ARPPacket(
                HardwareTYPE.Ethernet,
                ProtocolTYPE.IP,
                6, 4,
                ARP_OP.Request,
                this.host.eth0.MAC,
                this.host.ipModule.ipAddr,
                Buffer.from([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff ]),
                protoAddr
            );

            this.pendingRequests.set(protoAddr.toString("hex"), {
                protoAddr,
                timestamp: new Date().getTime(),
                callback: (e, cacheEntry) => {
                    if(e) return reject(e);
                    resolve(cacheEntry!);
                }
            });

            this.output.write(arp);
        });
    }

    public setAddress(hwAddr: Buffer, protoAddr: Buffer) {
        let protoStr = protoAddr.toString("hex");

        let cacheEntry: ARPCacheEntry = {
            hardwareAddr: hwAddr,
            protocolAddr: protoAddr,
            timestamp: new Date().getTime()
        }

        this.arpCache.set(protoStr, cacheEntry);

        return cacheEntry;
    }
}