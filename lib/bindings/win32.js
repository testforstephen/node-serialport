'use strict';
const binding = require('bindings')('serialport.node');
const CommonBinding = require('./common');
const promisify = require('../util').promisify;

class WindowsBinding extends CommonBinding {
  static list() {
    return promisify(binding.list)();
  }

  constructor(opt) {
    super(opt);
    this.binding = binding;
  }
}

module.exports = WindowsBinding;
