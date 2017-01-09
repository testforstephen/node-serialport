'use strict';

const assert = require('chai').assert;
const listLinux = require('./mocks/linux-list');

const ports = {
  'ttyS0':
    'DEVNAME=/dev/ttyS0\n' +
     'DEVPATH=/devices/platform/serial8250/tty/ttyS0\n' +
     'MAJOR=4\n' +
     'MINOR=64\n' +
     'SUBSYSTEM=tty\n',
  'ttyS1':
    'DEVNAME=/dev/ttyS1\n' +
    'DEVPATH=/devices/platform/serial8250/tty/ttyS1\n' +
    'MAJOR=4\n' +
    'MINOR=65\n' +
    'SUBSYSTEM=tty\n',
  'ttyUSB-Arduino':
    'DEVNAME=/dev/ttyUSB-Arduino\n' +
    'ID_VENDOR=Arduino (www.arduino.cc)\n' +
    'ID_SERIAL=752303138333518011C1\n' +
    'ID_VENDOR_ID=2341\n' +
    'ID_MODEL_ID=0043\n' +
    'DEVLINKS=/dev/serial/by-path/pci-0000:00:14.0-usb-0:2:1.0-port0 /dev/serial/by-id/pci-NATA_Siolynx2_C8T6VI1F-if00-port0\n',
  'ttyAMA_im_a_programmer':
    'DEVNAME=/dev/ttyAMA_im_a_programmer\n' +
    'DEVLINKS=/dev/serial/by-id/pci-NATA_Siolynx2_C8T6VI1F-if00-port0 /dev/serial/by-path/pci-0000:00:14.0-usb-0:2:1.0-port0\n',
  'ttyMFD0':
    'DEVNAME=/dev/ttyMFD0\n' +
    'ID_VENDOR_ID=0x2341\n' +
    'ID_MODEL_ID=0x0043\n',
  'rfcomm4':
    'DEVNAME=/dev/rfcomm4\n',
  'ttyNOTASERIALPORT': ''
};

const portOutput = [
  {
    comName: '/dev/ttyS0',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    vendorId: undefined,
    productId: undefined
  },
  {
    comName: '/dev/ttyS1',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    vendorId: undefined,
    productId: undefined
  },
  {
    comName: '/dev/ttyUSB-Arduino',
    manufacturer: 'Arduino (www.arduino.cc)',
    serialNumber: '752303138333518011C1',
    pnpId: 'pci-NATA_Siolynx2_C8T6VI1F-if00-port0',
    vendorId: '0x2341',
    productId: '0x0043'
  },
  {
    comName: '/dev/ttyAMA_im_a_programmer',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: 'pci-NATA_Siolynx2_C8T6VI1F-if00-port0',
    vendorId: undefined,
    productId: undefined
  },
  {
    comName: '/dev/ttyMFD0',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    vendorId: '0x2341',
    productId: '0x0043'
  },
  {
    comName: '/dev/rfcomm4',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    vendorId: undefined,
    productId: undefined
  }
];

describe('listLinux', () => {
  beforeEach(() => {
    listLinux.reset();
  });

  it('lists available serialports', () => {
    listLinux.setPorts(ports);
    return listLinux().then((ports) => {
      assert.deepEqual(ports, portOutput);
    });
  });

  it('does not list non character devices', () => {
    listLinux.setCharacterDevice(false);
    listLinux.setPorts(ports);
    return listLinux().then((ports) => {
      assert.deepEqual(ports, []);
    });
  });

  it('returns an error to callback', () => {
    listLinux.error(true);
    return listLinux().then(() => {
      assert.isFalse(true, `shouldn't succeed`);
    }, (err) => {
      assert.instanceOf(err, Error);
    });
  });
});
