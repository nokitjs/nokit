/**
 * session 类
 **/
function Session(sessionId, sessionStore) {
    var self = this;
    self.sessionId = sessionId;
    self.sessionStore = sessionStore;
}

/**
 * 保持活动状态
 **/
Session.prototype.active = function () {
    var self = this;
    self.sessionStore.active(self.sessionId);
    return self;
};

/**
 * 设置一个 seesion
 **/
Session.prototype.set = function (name, value, callback) {
    var self = this;
    self.sessionStore.set(self.sessionId, name, value, callback);
    return self;
};

/**
 * 获取一个 seesion 值
 **/
Session.prototype.get = function (name, callback) {
    var self = this;
    self.sessionStore.get(self.sessionId, name, callback);
    return self;
};

/**
 * 移除一个 session
 **/
Session.prototype.remove = function (name, callback) {
    var self = this;
    self.sessionStore.remove(self.sessionId, name, callback);
    return self;
};

module.exports = Session;
/*end*/