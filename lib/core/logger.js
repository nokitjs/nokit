var console = require("./console");
var utils = require("./utils");

var Logger = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.buffer = [];
};

Logger.prototype.getTimePrefix = function() {
    return utils.formatDate(new Date(), "[yyyy-MM-dd hh:ss] ");
};

Logger.prototype.log = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'log',
        msg: self.getTimePrefix() + msg
    });
};

Logger.prototype.info = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'info',
        msg: self.getTimePrefix() + msg
    });
};

Logger.prototype.warn = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'warn',
        msg: self.getTimePrefix() + msg
    });
};

Logger.prototype.error = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'error',
        msg: self.getTimePrefix() + msg
    });
};

Logger.prototype.writeBuffer = function() {
    var self = this;
    var item = self.buffer.shift();
    while (item) {
        console[item.type](item.msg);
        item = self.buffer.shift();
    }
};