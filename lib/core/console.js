/* global __dirname */
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var colors = require('./colors');
var pkg = require("../../package.json");
require('console.table');

var self = exports;

var PREFIX_LOG = "[" + pkg.rawName + "][L]: ",
    PREFIX_INFO = "[" + pkg.rawName + "][I]: ",
    PREFIX_WARN = "[" + pkg.rawName + "][W]: ",
    PREFIX_ERROR = "[" + pkg.rawName + "][E]: ";

self.log = function (msg, noPrefix) {
    msg = msg || '';
    console.log(noPrefix ? msg : (PREFIX_LOG + msg));
};

self.info = function (msg, noPrefix) {
    msg = colors.green(msg || '');
    console.info(noPrefix ? msg : (PREFIX_INFO + msg));
};

self.warn = function (msg, noPrefix) {
    msg = colors.yellow(msg || '');
    console.warn(noPrefix ? msg : (PREFIX_WARN + msg));
};

self.error = function (msg, noPrefix) {
    msg = colors.red(msg || '');
    console.error(noPrefix ? msg : (PREFIX_ERROR + msg));
};

self.table = function (data) {
    console.table(data);
};