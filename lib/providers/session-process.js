/**
 * SessionProcess 类
 **/
function SessionProcess(server) {
    var self = this;
    self.utils = server.require('$./core/utils');
};

/**
 * 初始化
 **/
SessionProcess.prototype.init = function (configs, callback) {
    var self = this;
    self.configs = configs;
    self.store = {};
    if (callback) callback();
};

/**
 * 清理过期 session
 **/
SessionProcess.prototype._clearTimeout = function () {
    var self = this;
    var now = new Date().getTime();
    var timeout = self.configs.timeout * 1000; // timeout 单位:秒
    self.utils.each(self.store, function (sessionId, sessionObj) {
        //如果过期清除存储的内容
        if (now - sessionObj.__lastActive > timeout) {
            self.store[sessionId] = null;
            delete self.store[sessionId];
        }
    });
};

/**
 * 设置一个 seesion
 **/
SessionProcess.prototype.load = function (sessionId, callback) {
    var self = this;
    self._clearTimeout();
    var sessionObj = self.store[sessionId] || {};
    sessionObj.__lastActive = (new Date()).getTime();
    if (callback) callback(sessionObj);
};

/**
 * 获取一个 seesion 值
 **/
SessionProcess.prototype.save = function (sessionId, sessionObj, callback) {
    var self = this;
    sessionObj.__lastActive = (new Date()).getTime();
    self.store[sessionId] = sessionObj;
    if (callback) callback();
};

module.exports = SessionProcess;
/*end*/