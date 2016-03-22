var http = require('http');
var path = require('path');
var fs = require('fs');
var util = require("util");
var utils = require("./utils");
var qs = require("querystring");
var url = require("url");

function Request(context) {
  var self = this;
  self.context = context;
};

util.inherits(Request, http.IncomingMessage);

/**
 * 释放资源
 **/
Request.prototype.dispose = utils.defineDisposer([
  "context"
]);

/**
 * 匹配合适的静态目录配置
 **/
Request.prototype._matchPhysicalInfo = function(url) {
  var self = this;
  var rules = self.context.configs.folders.public;
  var physicalInfo = utils.each(rules, function(exprText, _path) {
    if (exprText === "*") return;
    var expr = RegExp(exprText);
    if (expr.test(url)) {
      return {
        folderPath: _path,
        filePath: expr.exec(url)[1]
      };
    }
  }) || {};
  physicalInfo.folderPath = physicalInfo.folderPath || rules["*"];
  return {
    folderPath: self.context.server.resolvePath(physicalInfo.folderPath),
    filePath: physicalInfo.filePath || url
  }
};

/**
 * 设置当前 URL
 **/
Request.prototype.setUrl = function(url, doNotUpdatePhysicalPath) {
  var self = this;
  url = (url || "/").replace(/\.\./g, "");
  //可能会出现 “URIError: URI malformed”
  try {
    self.url = decodeURI(utils.normalizeUrl(url));
  } catch (ex) {
    self.url = url;
  }
  var urlParts = self.url.split('?');
  self.withoutQueryStringURL = self.withoutQueryStringUrl = urlParts[0].split('#')[0];
  self.queryString = (urlParts[1] || '').split('#')[0];
  if (doNotUpdatePhysicalPath) return;
  //处理物理路径信息
  var physicalInfo = self._matchPhysicalInfo(self.withoutQueryStringUrl);
  self.publicPath = physicalInfo.folderPath;
  self.setPhysicalPath(physicalInfo.folderPath + '/' + physicalInfo.filePath);
};

/**
 * 设置物理路径
 **/
Request.prototype.setPhysicalPath = function(_path) {
  var self = this;
  self.physicalPath = path.normalize(_path);
  self.extname = path.extname(self.physicalPath);
  self.mime = self.context.server.mime(self.extname) || self.context.server.mime("*");
  self._physicalPathExists = null;
  self._physicalPathStats = null;
};

/**
 * 物理路径是否存在
 **/
Request.prototype.physicalPathExists = function(callback) {
  var self = this;
  if (!callback) return;
  if (!utils.isNull(self._physicalPathExists)) {
    return callback(self._physicalPathExists);
  }
  if (!utils.isString(self.physicalPath)) {
    self._physicalPathExists = false;
    return callback(self._physicalPathExists);
  }
  fs.exists(self.physicalPath, function(exists) {
    self._physicalPathExists = exists;
    return callback(self._physicalPathExists);
  });
};

/**
 * 检查物理路径信息
 **/
Request.prototype.physicalPathStat = function(callback) {
  var self = this;
  if (!callback) return;
  if (!utils.isNull(self._physicalPathStats)) {
    return callback(self._physicalPathStats, self._physicalPathExists);
  }
  self.physicalPathExists(function(exists) {
    if (!exists) {
      self._physicalPathStats = {};
      return callback(self._physicalPathStats, self._physicalPathExists);
    }
    fs.stat(self.physicalPath, function(err, stats) {
      if (err) {
        return self.context.error(err);
      }
      self._physicalPathStats = stats;
      return callback(self._physicalPathStats, self._physicalPathExists);
    });
  });
};

/**
 * 查询参数
 **/
utils.defineGetter(Request.prototype, "query", function() {
  var self = this;
  if (self._query) {
    return self._query;
  }
  self._query = qs.parse(self.queryString) || {};
  return self._query;
});

/**
 * 客户端信息
 **/
utils.defineGetter(Request.prototype, 'clientInfo', function() {
  var self = this;
  if (self._clientInfo) {
    return self._clientInfo;
  }
  self._clientInfo = {};
  self._clientInfo.ip = self.headers['x-forwarded-for'] || self.connection.remoteAddress || self.socket.remoteAddress;
  var hostParts = (self.headers['host'] || '').split(':');
  self._clientInfo.host = hostParts[0];
  self._clientInfo.port = hostParts[1];
  self._clientInfo.userAgent = self.headers['user-agent'];
  //解析出客户端所有接受的语言
  self._clientInfo.languages = (self.headers["accept-language"] || '')
    .split(',')
    .map(function(name) {
      return name.split(';')[0]
    });
  return self._clientInfo;
});

Request.init = function(context) {
  context.request.__proto__ = new Request(context);
  context.request.setUrl(context.request.url);
};

module.exports = Request;