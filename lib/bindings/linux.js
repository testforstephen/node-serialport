'use strict';
const binding = require('bindings')('serialport.node');
const CommonBinding = require('./common');
const unixRead = require('./unix-read');
const linuxList = require('./linux-list');

const defaultBindingOptions = Object.freeze({
  vmin: 1,
  vtime: 0
});

class LinuxBinding extends CommonBinding {
  static list() {
    return linuxList();
  }

  constructor(opt) {
    super(opt);
    this.binding = binding;
  }

  read() {
    return unixRead.apply(this, arguments);
  }

  open(path, options) {
    if (typeof options !== 'object') {
      throw new TypeError('"options" is not an object');
    }

    options = Object.assign({}, defaultBindingOptions, this.bindingOptions, options);
    return super.open(path, options);
  }

  close() {
    if (!this.isOpen) {
      return Promise.reject(new Error('Port is not open'));
    }

    if (this.readPoller) {
      this.readPoller.close();
      this.readPoller = null;
    }
    return super.close();
  }
}

module.exports = LinuxBinding;
