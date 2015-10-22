var utils = require('./utils');
var console = require('./console');

/**
 * session 类
 **/
function Session(context) {
    var self = this;
    self.context = context;
    self.sessionId = self.context.sessionId;
    self.server = self.context.server;
    self.server.sessionStore = self.server.sessionStore || {};
    self._clearTimeout();
    self.server.sessionStore[self.sessionId] = self.server.sessionStore[self.sessionId] || {};
    self.server.sessionStore[self.sessionId].lastTime = new Date().getTime();
    self.server.sessionStore[self.sessionId].items = self.server.sessionStore[self.sessionId].items || {};
};

/**
 * 清理过期 session
 **/
Session.prototype._clearTimeout = function() {
    var self = this;
    var now = new Date().getTime();
    var timeout = self.server.configs.session.timeout * 1000; // timeout 单位:秒
    utils.each(self.server.sessionStore, function(_sessionId, _store) {
        //如果过期清除存储的内容
        if (now - _store.lastTime > timeout) {
            self.server.sessionStore[_sessionId] = null;
            delete self.server.sessionStore[_sessionId];
        }
    });
};

/**
 * 设置一个 seesion
 **/
Session.prototype.set = function(name, value, callback) {
    var self = this;
    self.server.sessionStore[self.sessionId].items[name] = value;
    if (callback) callback();
};

/**
 * 获取一个 seesion 值
 **/
Session.prototype.get = function(name, callback) {
    var self = this;
    var val = self.server.sessionStore[self.sessionId].items[name];
    if (callback) callback(val);
};

/**
 * 移除一个 session
 **/
Session.prototype.remove = function(name, callback) {
    var self = this;
    self.server.sessionStore[self.sessionId].items[name] = null;
    delete self.server.sessionStore[self.sessionId].items[name];
    if (callback) callback();
};

module.exports = Session;
/*end*/