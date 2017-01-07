'use strict';
const BaseBinding = require('./base');
const inherits = require('util').inherits;

function ClosedPortError(name) {
  name = name || 'unknown method:';
  this.message = `Port is closed: ${name}`;
  this.name = 'ClosedPortError';
  Error.captureStackTrace(this, ClosedPortError);
}
inherits(ClosedPortError, Error);

let ports = {};

class MockBindings extends BaseBinding {
  constructor(opt) {
    super(opt);
    this.onDisconnect = opt.disconnect;
    this.pendingReadCB = null;
    this.isOpen = false;
  }

  // Reset mocks
  static reset() {
    ports = {};
  }

  // Create a mock port
  static createPort(path, opt) {
    opt = Object.assign({
      echo: true,
      readyData: new Buffer('READY')
    }, opt);

    ports[path] = {
      data: new Buffer(0),
      lastWrite: null,
      echo: opt.echo,
      readyData: opt.readyData,
      info: {
        comName: path,
        manufacturer: 'The J5 Robotics Company',
        serialNumber: undefined,
        pnpId: undefined,
        locationId: undefined,
        vendorId: undefined,
        productId: undefined
      }
    };
  }

  static list() {
    const info = Object.keys(ports).map((path) => {
      return ports[path].info;
    });
    return Promise.resolve(info);
  }

  // emit data on a mock port
  emitData(data) {
    if (!this.isOpen) {
      return;
    }
    this.port.data = Buffer.concat([this.port.data, data]);

    if (!this.port.pendingReadCB) {
      return;
    }

    const buffer = this.port.pendingReadCB[0];
    const offset = this.port.pendingReadCB[1];
    const length = this.port.pendingReadCB[2];
    const resolve = this.port.pendingReadCB[3];
    const reject = this.port.pendingReadCB[4];
    this.port.pendingReadCB = null;
    process.nextTick(() => {
      this.read(buffer, offset, length).then(resolve, reject);
    });
  }

  // disconnect a mock port
  disconnect(err) {
    err = err || new Error('Disconnected');
    this.onDisconnect(err);
  }

  open(path, opt) {
    if (!path) {
      throw new TypeError('"path" is not a valid port');
    }

    if (typeof opt !== 'object') {
      throw new TypeError('"options" is not an object');
    }

    const port = this.port = ports[path];
    return new Promise((resolve, reject) => {
      if (!port) {
        return reject(new Error(`Port does not exist - please call MockBindings.createPort('${path}') first`));
      }

      if (port.openOpt && port.openOpt.lock) {
        return reject(new Error('Port is locked cannot open'));
      }

      if (this.isOpen) {
        return reject(new Error('Open: binding is already open'));
      }

      port.openOpt = Object.assign({}, opt);
      this.isOpen = true;
      resolve();
      if (port.echo) {
        process.nextTick(() => this.emitData(port.readyData));
      }
    });
  }

  close() {
    const port = this.port;
    return new Promise((resolve, reject) => {
      if (!port) {
        return reject(new ClosedPortError('close'));
      }
      delete port.openOpt;
      // reset data on close
      port.data = new Buffer(0);

      delete this.port;
      this.isOpen = false;
      resolve();
    });
  }

  read(buffer, offset, length) {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('read'));
      }

      if (this.port.data.length <= 0) {
        this.port.pendingReadCB = [buffer, offset, length, resolve, reject];
        return;
      }
      const data = this.port.data.slice(0, length);
      const readLength = data.copy(buffer, offset);
      this.port.data = this.port.data.slice(length);

      resolve(readLength);
    });
  }

  write(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('"buffer" is not a Buffer');
    }

    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('write'));
      }

      const data = this.port.lastWrite = new Buffer(buffer); // copy
      resolve();
      if (this.port.echo) {
        process.nextTick(() => this.emitData(data));
      }
    });
  }

  update(opt) {
    if (typeof opt !== 'object') {
      throw new TypeError('"options" is not an object');
    }

    if (typeof opt.baudRate !== 'number') {
      throw new TypeError('"options.baudRate" is not a number');
    }

    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('update'));
      }
      this.port.openOpt.baudRate = opt.baudRate;
      resolve();
    });
  }

  set(opt) {
    if (typeof opt !== 'object') {
      throw new TypeError('"options" is not an object');
    }

    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('set'));
      }
      resolve();
    });
  }

  get() {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('flush'));
      }
      resolve({
        cts: true,
        dsr: false,
        dcd: false
      });
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('flush'));
      }
      resolve();
    });
  }

  drain() {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        return reject(new ClosedPortError('drain'));
      }
      resolve();
    });
  }
}

module.exports = MockBindings;
