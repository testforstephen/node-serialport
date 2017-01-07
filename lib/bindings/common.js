'use strict';
const BaseBinding = require('./base');
const promisify = require('../util').promisify;

class CommonBinding extends BaseBinding {
  static list() {
    return Promise.reject(new Error('Function not implemented'));
  }

  constructor(opt) {
    super(opt);
    this.disconnect = opt.disconnect;
    this.bindingOptions = opt.bindingOptions || {};
    this.fd = null;
  }

  open(path, options) {
    super.open(path, options);
    return promisify(this.binding.open)(path, options).then((fd) => {
      this.fd = fd;
    });
  }

  close() {
    super.close();
    return promisify(this.binding.close)(this.fd).then(() => {
      this.fd = null;
    });
  }

  read(buffer, offset, length) {
    super.read(buffer, offset, length);
    return promisify(this.binding.read)(this.fd, buffer, offset, length);
  }

  write(buffer) {
    super.write(buffer);
    return promisify(this.binding.write)(this.fd, buffer);
  }

  update(options) {
    super.update(options);
    return promisify(this.binding.update)(options);
  }

  set(options) {
    super.set(options);
    return promisify(this.binding.set)(this.fd, options);
  }

  get() {
    super.get();
    return promisify(this.binding.get)(this.fd);
  }

  drain() {
    super.drain();
    return promisify(this.binding.drain)(this.fd);
  }

  flush() {
    super.flush();
    return promisify(this.binding.flush)(this.fd);
  }
}

Object.defineProperty(CommonBinding.prototype, 'isOpen', {
  enumerable: true,
  get() {
    return this.fd !== null;
  }
});

module.exports = CommonBinding;
