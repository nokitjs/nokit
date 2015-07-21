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
    if (!self.server.configs.log.path) {
        var item = self.buffer.shift();
        while (item) {
            console[item.type](item.msg);
            item = self.buffer.shift();
        }
        return;
    } else {
        //不论写入是否成功
        var textBuffer = [];
        var item = self.buffer.shift();
        while (item) {
            textBuffer.push("[" + item.type[0].toUpperCase() + "]" + item.msg);
            item = self.buffer.shift();
        }
        textBuffer = textBuffer.join("\r\n") + (time ? " , " + time + 'ms\r\n' : "\r\n");
        var logFile = path.normalize(self.server.configs.log.path + "/" + utils.formatDate(new Date(), "yyyy-MM-dd.log"));
        fs.appendFile(logFile, textBuffer, null);
    }
};