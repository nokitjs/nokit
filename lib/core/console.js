var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var colors = require('./colors');
require('console.table');

var self = exports;

var packageInfo = utils.readJSONSync(path.resolve(__dirname, path.normalize("../../package.json")));
packageInfo.name = utils.firstUpper(packageInfo.name.split('-')[0]);

var PREFIX_LOG = "[" + packageInfo.name + "][L]: ",
    PREFIX_INFO = "[" + packageInfo.name + "][I]: ",
    PREFIX_WARN = "[" + packageInfo.name + "][W]: ",
    PREFIX_ERROR = "[" + packageInfo.name + "][E]: ";

self.log = function(msg, noPrefix) {
    msg = colors.white(msg || '');
    console.log(noPrefix ? msg : (PREFIX_LOG + msg));
};

self.info = function(msg, noPrefix) {
    msg = colors.green(msg || '');
    console.info(noPrefix ? msg : (PREFIX_INFO + msg));
};

self.warn = function(msg, noPrefix) {
    msg = colors.yellow(msg || '');
    console.warn(noPrefix ? msg : (PREFIX_WARN + msg));
};

self.error = function(msg, noPrefix) {
    msg = colors.red(msg || '');
    console.error(noPrefix ? msg : (PREFIX_ERROR + msg));
};

self.table = function(data) {
    console.table(data);
};