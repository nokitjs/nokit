/* global __dirname */
var utils = require("./utils");
var tp = require("tpjs");
var path = require("path");

var localeName = 'zh-cn';

var localeFile = path.normalize('../' + localeName + '.js');
localeFile = path.resolve(__dirname, localeFile);

var localeObject = utils.readJSONSync(localeFile);

var table = {};

utils.each(localeObject, function (key, value) {
    table[key] = tp.compile(value, {
        extend: utils
    });;
});

module.exports = table;