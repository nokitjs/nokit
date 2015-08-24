var console = require("./console");
var utils = require("./utils");
var fs = require("fs");
var path = require("path");

var Logger = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.buffer = [];
    if (self.server.configs.log.path) {
        fs.exists(self.server.configs.log.path, function(exists) {
            if (!exists) {
                fs.mkdir(self.server.configs.log.path);
            }
        });
    }
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

Logger.prototype.writeBuffer = function(time) {
    var self = this;
    if (self.buffer == null || self.buffer.length < 1) {
        return;
    }
    if (!utils.isNull(time)) {
        self.info("用时 " + time + 'ms');
    }
    if (self.server.configs.log.path) {
        var buffer = self.buffer.map(function(item) {
            return "[" + item.type[0].toUpperCase() + "]" + item.msg;
        });
        var text = buffer.join('\n') + '\n';
        var filename = utils.formatDate(new Date(), "yyyy-MM-dd.log");
        var logFile = path.normalize(self.server.configs.log.path + "/" + filename);
        fs.appendFile(logFile, text, null);
    } else {
        self.buffer.forEach(function(item) {
            console[item.type](item.msg);
        });
    }
    self.buffer = [];
};