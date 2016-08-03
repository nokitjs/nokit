const utils = require('./utils');
const console = require('./console');

/**
 * 定义 Cookie 类
 **/
function Cookie(context) {
  var self = this;
  self.context = context;
  self.response = context.response;
  self.request = context.request;
  self._cookieTable = {};
  self._parseRequestCookies();
};

/**
 * 释放资源
 **/
Cookie.prototype.dispose = utils.defineDisposer([
  "context",
  "request",
  "response"
]);

/**
 * 解析客户端请求回发来的 Cookie
 **/
Cookie.prototype._parseRequestCookies = function () {
  var self = this;
  //分解http请求内的cookie，其格式为 name=value; name=value; ...
  var cookieContent = self.request.getHeader("cookie", "").trim();
  utils.each(cookieContent.split(';'), function (i, cookieText) {
    if (!utils.contains(cookieText, '=')) return;
    var cookiePair = cookieText.split('=');
    var name = cookiePair[0].trim();
    var value = cookiePair[1].trim();
    self._cookieTable[name] = {
      "value": value,
      "options": {}
    };
  });
};

/**
 * 添加一个 cookie 
 **/
Cookie.prototype.set = function (name, value, options) {
  var self = this;
  options = options || {};
  options["path"] = options["path"] || "/";
  self._cookieTable[name] = {
    "_isNew": true,
    "value": value,
    "options": options
  };
  self.response.setHeader("Set-Cookie", self._toArray(true));
};

/**
 * 移除一个 cookie
 **/
Cookie.prototype.remove = function (name) {
  var self = this;
  self.set(name, '', {
    "Max-Age": 0
  });
};

/**
 * 获取 Cookie
 **/
Cookie.prototype.get = function (name, returnItem) {
  var self = this;
  var item = self._cookieTable[name];
  if (returnItem) {
    return item;
  } else {
    return (item || {}).value;
  }
};

/**
 * 输出为数组
 **/
Cookie.prototype._toArray = function (onlyNew) {
  var self = this;
  var arrayBuffer = [];
  utils.each(self._cookieTable, function (cookieName, cookie) {
    if (onlyNew && !cookie._isNew) return;
    var cookieBuffer = [cookieName + '=' + cookie.value];
    utils.each(cookie.options, function (optName, optValue) {
      if ((optName == 'httpOnly' || optName == 'secure') &&
        optValue) {
        cookieBuffer.push(optName);
      } else if (!utils.isNull(optValue)) {
        cookieBuffer.push(optName + '=' + optValue);
      }
    });
    arrayBuffer.push(cookieBuffer.join(';'));
  });
  return arrayBuffer;
};

module.exports = Cookie;
/*end*/