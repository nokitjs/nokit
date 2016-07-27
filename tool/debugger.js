/* global __dirname */
const fs = require('fs');
const path = require('path');
const os = require('os');
const self = exports;

self.enabled = false;

self.logFile = path.normalize(__dirname + '/debugger.log');
self.log = function(text) {
  if (!self.enabled) return;
  fs.appendFileSync(self.logFile, text + os.EOL);
};