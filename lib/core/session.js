var utils = require('./utils');
var generator = require("./generator");

var SID_COOKIE_NAME = 'NSID';
var SESSION_IS_DISABLED = "session is disabled";

/**
 * session 类
 **/
function Session(context) {
  var self = this;
  self.context = context;
  self.configs = self.context.configs.session;
  if (!self.configs.enabled) {
    return;
  }
  //处理 sessionId
  self.sessionId = self.context.cookie.get(SID_COOKIE_NAME);
  if (!self.sessionId) {
    self.sessionId = utils.newGuid().split('-').join('');
    self.context.cookie.set(SID_COOKIE_NAME, self.sessionId, {
      "httpOnly": true,
      "secure": self.configs.isHttps
    });
  }
  self.sessionStore = self.context.server.sessionStore;
  //通知活动状态
  self.sessionStore.active(self.sessionId);
}

/**
 * 释放资源
 **/
Session.prototype.dispose = utils.defineDisposer([
  "context"
]);

/**
 * 设置一个 seesion
 **/
Session.prototype.set = function(name, value, callback) {
  var self = this;
  if (!self.configs.enabled) {
    return self.context.error(SESSION_IS_DISABLED);
  }
  self.sessionStore.set(self.sessionId, name, value, callback);
  return self;
};

/**
 * 获取一个 seesion 值
 **/
Session.prototype.get = function(name, callback) {
  var self = this;
  if (!self.configs.enabled) {
    return self.context.error(SESSION_IS_DISABLED);
  }
  self.sessionStore.get(self.sessionId, name, callback);
  return self;
};

/**
 * 移除一个 session
 **/
Session.prototype.remove = function(name, callback) {
  var self = this;
  if (!self.configs.enabled) {
    return self.context.error(SESSION_IS_DISABLED);
  }
  self.sessionStore.remove(self.sessionId, name, callback);
  return self;
};

generator.wrap(Session.prototype);

module.exports = Session;
/*end*/