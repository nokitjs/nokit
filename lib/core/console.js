var fs = require('fs');
var utils = require('./utils');
var path = require('path');
var self = exports;

var packageInfo = utils.readJSONSync(path.resolve(__dirname, path.normalize("../../package.json")));
packageInfo.name = utils.firstUpper(packageInfo.name.split('-')[0]);

var PREFIX_LOG = "[" + packageInfo.name + "][L]: ",
    PREFIX_INFO = "[" + packageInfo.name + "][I]: ",
    PREFIX_WARN = "[" + packageInfo.name + "][W]: ",
    PREFIX_ERROR = "[" + packageInfo.name + "][E]: ";

self.log = function(msg, noPrefix) {
    console.error(noPrefix ? msg : (PREFIX_LOG + msg));
};

self.info = function(msg, noPrefix) {
    console.error(noPrefix ? msg : (PREFIX_INFO + msg));
};

self.warn = function(msg, noPrefix) {
    console.error(noPrefix ? msg : (PREFIX_WARN + msg));
};

self.error = function(msg, noPrefix) {
    console.error(noPrefix ? msg : (PREFIX_ERROR + msg));
};