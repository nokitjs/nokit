/**
 * session 存储对象
 **/
var sessionStore = {};

/**
 * session 类
 **/
function SessionProcess(context) {
    var self = this;
    self.context = context;
    self.sessionId = self.context.sessionId;
    self.server = self.context.server;
    self.utils = self.server.require('$./core/utils');
    sessionStore[self.sessionId] = sessionStore[self.sessionId] || {};
    sessionStore[self.sessionId].items = sessionStore[self.sessionId].items || {};
};

/**
 * 静态初始化方法
 * 一般用于和 session 存储服务进行连接
 **/
SessionProcess.init = function (server, callback) {
    if (callback) callback();
};

/**
 * 保持活动状态
 **/
SessionProcess.prototype.active = function () {
    var self = this;
    var now = new Date().getTime();
    //更新当前 sessionId 对象 seesionObj 的最后活动时间
    sessionStore[self.sessionId].lastActive = now;
    //清理过期 sessionObj
    var ttl = self.server.configs.session.timeout * 1000;
    self.utils.each(sessionStore, function (sessionId, sessionObj) {
        //如果过期清除存储的内容
        if (now - sessionObj.lastActive > ttl) {
            sessionStore[sessionId] = null;
            delete sessionStore[sessionId];
        }
    });
};

/**
 * 设置一个 seesion
 **/
SessionProcess.prototype.set = function (name, value, callback) {
    var self = this;
    sessionStore[self.sessionId].items[name] = value;
    if (callback) callback();
    return self;
};

/**
 * 获取一个 seesion 值
 **/
SessionProcess.prototype.get = function (name, callback) {
    var self = this;
    var val = sessionStore[self.sessionId].items[name];
    if (callback) callback(val);
    return self;
};

/**
 * 移除一个 session
 **/
SessionProcess.prototype.remove = function (name, callback) {
    var self = this;
    sessionStore[self.sessionId].items[name] = null;
    delete sessionStore[self.sessionId].items[name];
    if (callback) callback();
    return self;
};

module.exports = SessionProcess;
/*end*/