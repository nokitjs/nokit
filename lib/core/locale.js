/* global __dirname */
var utils = require("./utils");
var tp = require("tpjs");
var path = require("path");

var DEFAULT_LOCALE_NAME = 'zh-cn';

var Locale = module.exports = function (server) {
    var self = this;
    self.server = server;
    self.localeCache = {};
};

Locale.prototype._compileByPath = function (localeFile) {
    var self = this;
    localeFile = self.server.resolvePath(localeFile);
    var localeObject = utils.readJSONSync(localeFile);
    utils.each(localeObject, function (key, value) {
        localeObject[key] = tp.compile(value, {
            extend: utils
        });;
    });
    return localeObject;
};

Locale.prototype._compileByName = function (name) {
    var self = this;
    if (!self.localeCache[name]) {
        var localeFile = self.server.resolvePath(path.normalize('./locales/' + name + '.json'));
        self.localeCache[name] = self.compileByPath(localeFile);
    }
    return self.localeCache[name];
};

Locale.prototype.preload = function () {

};

Locale.prototype.get = function (context) {
    var self = this;
    var localeName = context.request.headers['language'];
    return self._compileByName(localeName);
};