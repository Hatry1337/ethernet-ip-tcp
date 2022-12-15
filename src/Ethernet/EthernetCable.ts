import EthernetPort from "./EthernetPort";

export class EthernetCable {
    private _eth0?: EthernetPort;
    private _eth1?: EthernetPort;

    public isConnected() {
        return !!(this._eth0 && this._eth1);
    }

    public connect(port1: EthernetPort, port2: EthernetPort) {
        if(this.isConnected() || port1.cable || port2.cable) {
            throw new Error("EALRDCONN: You should disconnect port before connect it.");
        }

        this._eth0 = port1;
        this._eth1 = port2;

        this._eth0.cable = this;
        this._eth1.cable = this;

        this._eth0.txStream.pipe(this._eth1.rxStream);
        this._eth1.txStream.pipe(this._eth0.rxStream);
    }

    public disconnect() {
        if(this._eth0 && this._eth1){
            this._eth0.txStream.unpipe(this._eth1.rxStream);
            this._eth1.txStream.unpipe(this._eth0.rxStream);

            this._eth0.cable = undefined;
            this._eth1.cable = undefined;
        }
    }

    public static connect(port1: EthernetPort, port2: EthernetPort) {
        if(port1.cable || port2.cable) {
            throw new Error("EALRDCONN: You should disconnect port before connect it.");
        }
        let cab = new EthernetCable();
        cab.connect(port1, port2);
    }
}