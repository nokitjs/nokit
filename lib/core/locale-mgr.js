/* global __dirname */
var utils = require("./utils");
var path = require("path");
var fs = require("fs");

//定义本地化管理器
var Locale = function(server) {
  var self = this;
  self.server = server;
  self.viewEngine = server.viewEngine;
  self.configs = server.configs.locale;
  self.localeTable = {};
};

//编译 locale object
Locale.prototype._complieLocaleObject = function(localeObject) {
  var self = this;
  var map = {};
  for (var key in localeObject) {
    map[key] = self.viewEngine.compileText(localeObject[key]);
  }
  return map;
};

//加载所有本地化资源
Locale.prototype.load = function() {
  var self = this;
  self.localeDir = self.server.resolvePath(self.configs.path);
  if (!fs.existsSync(self.localeDir)) {
    return;
  }
  var entryList = fs.readdirSync(self.localeDir);
  entryList.forEach(function(item) {
    var localeFile = self.localeDir + '/' + item;
    if ((/.json$/igm.test(localeFile) || /.js$/igm.test(localeFile)) &&
      !fs.statSync(localeFile).isDirectory()) {
      var localeObject = require(localeFile);
      var localeName = path.basename(localeFile).split('.')[0].toLowerCase();
      self.localeTable[localeName] = self._complieLocaleObject(localeObject);
    }
  });
};

//获取指定名称的 locale 对象
Locale.prototype.get = function(localeName) {
  var self = this;
  if (!localeName) return;
  localeName = localeName.toLowerCase();
  return self.localeTable[localeName];
};

//获取指定本地化资源
Locale.prototype.getByContext = function(context) {
  var self = this;
  var localeNames = [];
  if (self.configs.fixed) {
    localeNames.push(self.configs.fixed);
  }
  localeNames.push.apply(localeNames, context.request.clientInfo.languages);
  if (self.configs.default) {
    localeNames.push(self.configs.default);
  }
  return utils.each(localeNames, function(i, localeName) {
    return self.get(localeName);
  });
};

module.exports = Locale;