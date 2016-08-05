/**
 * session 存储对象
 **/
const sessionStore = {};

/**
 * session 类
 **/
function SessionProcess(server) {
  var self = this;
  self.server = server;
  self.utils = self.server.require('$./core/utils');
}

/**
 * 静态初始化方法
 * 一般用于和 session 存储服务进行连接
 **/
SessionProcess.prototype.init = function(server, callback) {
  var self = this;
  if (callback) callback();
  return self;
};

//清理过期 sessionObj
SessionProcess.prototype._clearObj = function(now) {
  var self = this;
  var ttl = self.server.configs.session.timeout * 1000;
  self.utils.each(sessionStore, function(_sessionId, sessionObj) {
    //如果过期清除存储的内容
    if (now - sessionObj.lastActive > ttl) {
      sessionStore[_sessionId] = null;
      delete sessionStore[_sessionId];
    }
  });
  return self;
};

//创建 sessionObj
SessionProcess.prototype._cerateObj = function(sessionId) {
  sessionStore[sessionId] = sessionStore[sessionId] || {};
  sessionStore[sessionId].items = sessionStore[sessionId].items || {};
};

/**
 * 保持活动状态
 **/
SessionProcess.prototype.active = function(sessionId) {
  var self = this;
  self._cerateObj(sessionId);
  var now = new Date().getTime();
  //更新当前 sessionId 对象 seesionObj 的最后活动时间
  sessionStore[sessionId].lastActive = now;
  self._clearObj(now);
  return self;
};

/**
 * 设置一个 seesion
 **/
SessionProcess.prototype.set = function(sessionId, name, value, callback) {
  var self = this;
  self._cerateObj(sessionId);
  sessionStore[sessionId].items[name] = value;
  if (callback) callback();
  return self;
};

/**
 * 获取一个 seesion 值
 **/
SessionProcess.prototype.get = function(sessionId, name, callback) {
  var self = this;
  self._cerateObj(sessionId);
  var val = sessionStore[sessionId].items[name];
  if (callback) callback(val);
  return self;
};

/**
 * 移除一个 session
 **/
SessionProcess.prototype.remove = function(sessionId, name, callback) {
  var self = this;
  self._cerateObj(sessionId);
  sessionStore[sessionId].items[name] = null;
  delete sessionStore[sessionId].items[name];
  if (callback) callback();
  return self;
};

module.exports = SessionProcess;
/*end*/