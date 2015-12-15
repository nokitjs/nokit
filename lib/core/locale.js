/* global __dirname */
var utils = require("./utils");
var path = require("path");
var fs = require("fs");

//定义本地化管理器
var Locale = function (server) {
    var self = this;
    self.server = server;
    self.viewEngine = server.viewEngine;
    self.localeDir = server.configs.locales;
    self.localeTable = {};
};

//加载所有本地化资源
Locale.prototype.load = function () {
    var self = this;
    self.localeDir = self.server.resolvePath(self.localeDir);
    if (!fs.existsSync(self.localeDir)) {
        return;
    }
    var entryList = fs.readdirSync(self.localeDir);
    entryList.forEach(function (item) {
        var localeFile = self.localeDir + '/' + item;
        if ((/.json$/igm.test(localeFile) || /.js$/igm.test(localeFile)) &&
            !fs.statSync(localeFile).isDirectory()) {
            var localeObject = require(localeFile);
            var localeName = path.basename(localeFile).split('.')[0];
            self.localeTable[localeName] = self._complieLocaleObject(localeObject);
        }
    });
};

//编译 locale object
Locale.prototype._complieLocaleObject = function (localeObject) {
    var self = this;
    var map = {};
    for (var key in localeObject) {
        map[key] = self.viewEngine.compileText(localeObject[key]);
    }
    return map;
};

//获取指定本地化资源
Locale.prototype.get = function (languages) {
    var self = this;
    return utils.each(languages, function (index, name) {
        if (!name) return;
        name = name.toLowerCase();
        if (self.localeTable[name]) {
            return self.localeTable[name];
        }
    });
};

module.exports = Locale;