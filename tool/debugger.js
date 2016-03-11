/* global __dirname */
var fs = require('fs');
var path = require('path');
var os = require('os');
var self = exports;

self.enabled = false;

self.logFile = path.normalize(__dirname + '/debugger.log');
self.log = function(text) {
  if (!self.enabled) return;
  fs.appendFileSync(self.logFile, text + os.EOL);
};