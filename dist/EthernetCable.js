"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetCable = void 0;
class EthernetCable {
    get conn0() { return this._conn0; }
    ;
    get conn1() { return this._conn1; }
    ;
    connect0(port) {
        this._conn0 = port;
        this.tryLink();
    }
    connect1(port) {
        this._conn1 = port;
        this.tryLink();
    }
    tryLink() {
        if (this._conn0 && this._conn1) {
            this._conn0.txStream.pipe(this._conn1.rxStream);
            this._conn1.txStream.pipe(this._conn0.rxStream);
        }
    }
}
exports.EthernetCable = EthernetCable;
//# sourceMappingURL=EthernetCable.js.map