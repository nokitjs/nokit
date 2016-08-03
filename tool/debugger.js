const fs = require('fs');
const path = require('path');
const os = require('os');
const self = exports;

self.enabled = true;

self.logFile = path.normalize(__dirname + '/debugger.log');
self.log = function (obj) {
  if (!self.enabled) return;
  fs.appendFileSync(self.logFile, JSON.stringify(obj) + os.EOL);
};