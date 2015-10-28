/* global __dirname */
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var colors = require('./colors');
var pkg = require("../../package.json");
require('console.table');

var self = exports;

var pkgName = utils.firstUpper(pkg.name);

var PREFIX_LOG = "[" + pkgName + "][L]: ",
    PREFIX_INFO = "[" + pkgName + "][I]: ",
    PREFIX_WARN = "[" + pkgName + "][W]: ",
    PREFIX_ERROR = "[" + pkgName + "][E]: ";

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