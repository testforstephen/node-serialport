'use strict';

function BrowserBindings(opt) {
  if (!(global.chrome && global.chrome.serial)) {
    throw new TypeError('"chrome.serial" is not an object');
  }

  if (typeof opt.disconnect !== 'function') {
    throw new TypeError('"options.disconnect" is not a function');
  }
  this.onDisconnect = opt.disconnect;
  this.serial = global.chrome.serial;
  this.connectionId = null;
};

BrowserBindings.list = function(cb) {
  if (!(global.chrome && global.chrome.serial)) {
    throw new TypeError('"chrome.serial" is not an object');
  }

  global.chrome.serial.getDevices(ports => {
    const info = ports.map(port => ({
      comName: port.name,
      vendorId: port.vendorId,
      productId: port.productId,
      displayName: port.displayName
    }));
    cb(null, info);
  });
};

Object.defineProperties(BrowserBindings.prototype, {
  isOpen: {
    enumerable: true,
    get() {
      return Boolean(this.connectionId);
    }
  }
});

BrowserBindings.prototype.open = function(path, opt, cb) {
  if (!path) {
    throw new TypeError('"path" is not a valid port');
  }

  if (typeof opt !== 'object') {
    throw new TypeError('"options" is not an object');
  }

  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }

  const chromeOptions = {
    paused: true
  };

  this.serial.connect(path, chromeOptions, info => {
    if (global.chrome.runtime.lastError) {
      return cb(global.chrome.runtime.lastError);
    }
    if (info.connectionId === -1) {
      return cb(new Error(`Unable to connect to "${path}" for unknown reasons`));
    }
    this.connectionId = info.connectionId;
    cb(null);
  });
};

BrowserBindings.prototype.close = function(cb) {
  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }

  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  this.serial.disconnect(this.connectionId, (result) => {
    if (global.chrome.runtime.lastError) {
      return cb(global.chrome.runtime.lastError);
    }
    console.log(result);
    cb(null);
  });
};

BrowserBindings.prototype.update = function(opt, cb) {
  if (typeof opt !== 'object') {
    throw new TypeError('"options" is not an object');
  }
  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }
  if (typeof opt.baudRate !== 'number') {
    throw new TypeError('"options.baudRate" is not a number');
  }

  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  this.port.openOpt.baudRate = opt.baudRate;
  processNextTick(cb, null);
};

BrowserBindings.prototype.set = function(opt, cb) {
  if (typeof opt !== 'object') {
    throw new TypeError('"options" is not an object');
  }
  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }

  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  processNextTick(cb, null);
};

BrowserBindings.prototype.write = function(buffer, cb) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('"buffer" is not a Buffer');
  }

  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }

  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }

  const data = this.port.lastWrite = new Buffer(buffer); // copy
  processNextTick(cb, null);

  if (this.port.echo) {
    process.nextTick(this.emitData.bind(this, data));
  }
};

BrowserBindings.prototype.read = function(buffer, offset, length, cb) {
  if (typeof cb !== 'function') {
    throw new TypeError('"cb" in read is not a function');
  }

  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }

  if (this.port.data.length <= 0) {
    this.port.pendingReadCB = [buffer, offset, length, cb];
    return;
  }
  const data = this.port.data.slice(0, length);
  const readLength = data.copy(buffer, offset);
  this.port.data = this.port.data.slice(length);

  processNextTick(cb, null, readLength, buffer);
};

BrowserBindings.prototype.get = function(cb) {
  if (typeof cb !== 'function') {
    throw new TypeError('"cb" is not a function');
  }
  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  processNextTick(cb, null, {
    cts: true,
    dsr: false,
    dcd: false
  });
};

BrowserBindings.prototype.flush = function(cb) {
  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  processNextTick(cb, null);
};

BrowserBindings.prototype.drain = function(cb) {
  if (!this.isOpen) {
    process.nextTick(() => cb(new Error('Port is already closed')));
    return;
  }
  processNextTick(cb, null);
};

module.exports = BrowserBindings;
