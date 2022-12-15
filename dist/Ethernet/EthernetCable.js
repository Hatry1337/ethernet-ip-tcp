"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetCable = void 0;
class EthernetCable {
    isConnected() {
        return !!(this._eth0 && this._eth1);
    }
    connect(port1, port2) {
        if (this.isConnected() || port1.cable || port2.cable) {
            throw new Error("EALRDCONN: You should disconnect port before connect it.");
        }
        this._eth0 = port1;
        this._eth1 = port2;
        this._eth0.cable = this;
        this._eth1.cable = this;
        this._eth0.txStream.pipe(this._eth1.rxStream);
        this._eth1.txStream.pipe(this._eth0.rxStream);
    }
    disconnect() {
        if (this._eth0 && this._eth1) {
            this._eth0.txStream.unpipe(this._eth1.rxStream);
            this._eth1.txStream.unpipe(this._eth0.rxStream);
            this._eth0.cable = undefined;
            this._eth1.cable = undefined;
        }
    }
    static connect(port1, port2) {
        if (port1.cable || port2.cable) {
            throw new Error("EALRDCONN: You should disconnect port before connect it.");
        }
        let cab = new EthernetCable();
        cab.connect(port1, port2);
    }
}
exports.EthernetCable = EthernetCable;
//# sourceMappingURL=EthernetCable.js.map