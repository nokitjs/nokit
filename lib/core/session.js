var utils = require('./utils');
var console = require('./console');

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
Session.prototype.add = function(name, value, callback) {
    var self = this;
    self.server.sessionStore[self.sessionId].items[name] = value;
    if (callback) callback();
};

Session.prototype.remove = function(name, callback) {
    var self = this;
    self.server.sessionStore[self.sessionId].items[name] = null;
    delete self.server.sessionStore[self.sessionId].items[name];
    if (callback) callback();
};

Session.prototype.get = function(name, callback) {
    var self = this;
    var val = self.server.sessionStore[self.sessionId].items[name];
    if (callback) callback(val);
};

module.exports = Session;
/*end*/