var utils = require('./utils');
var console = require('./console');

var sessionStore = {};

function Session(options) {
    var self = this;
    self.options = options || {};
    self.sessionId = self.options.sessionId;
    self.server = self.options.server;
    self.clearTimeout();
    sessionStore[self.sessionId] = sessionStore[self.sessionId] || {};
    sessionStore[self.sessionId].lastTime = new Date().getTime();
    sessionStore[self.sessionId].items = sessionStore[self.sessionId].items || {};
};
Session.prototype.clearTimeout = function() {
    var self = this;
    var now = new Date().getTime();
    var timeout = self.server.configs.session.timeout * 60 * 1000; //单位:分种
    utils.each(sessionStore, function(_sessionId, _store) {
        //如果过期清除存储的内容
        if (now - _store.lastTime > timeout) {
            sessionStore[_sessionId] = null;
            delete sessionStore[_sessionId];
        }
    });
};
Session.prototype.add = function(name, value) {
    var self = this;
    sessionStore[self.sessionId].items[name] = value;
};

Session.prototype.remove = function(name) {
    var self = this;
    sessionStore[self.sessionId].items[name] = null;
    delete sessionStore[self.sessionId].items[name];
};

Session.prototype.get = function(name) {
    var self = this;
    return sessionStore[self.sessionId].items[name];
};

module.exports = Session;
/*end*/