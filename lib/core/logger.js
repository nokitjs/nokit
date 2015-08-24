var console = require("./console");
var utils = require("./utils");
var fs = require("fs");
var path = require("path");

var Logger = module.exports = function() {
    var self = this;
    self._beginTime = Date.now();
    self.buffer = [];
};

Logger.init = function(server) {
    if (server.configs.log.path) {
        var exists = fs.existsSync(server.configs.log.path);
        if (!exists) {
            fs.mkdirSync(server.configs.log.path);
        }
        Logger.path = server.configs.log.path;
    }
};

Logger.prototype._getTimePrefix = function() {
    return utils.formatDate(new Date(), "[yyyy-MM-dd hh:ss] ");
};

Logger.prototype.log = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'log',
        msg: self._getTimePrefix() + msg
    });
};

Logger.prototype.info = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'info',
        msg: self._getTimePrefix() + msg
    });
};

Logger.prototype.warn = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'warn',
        msg: self._getTimePrefix() + msg
    });
};

Logger.prototype.error = function(msg) {
    var self = this;
    self.buffer.push({
        type: 'error',
        msg: self._getTimePrefix() + msg
    });
};

Logger.prototype.writeBuffer = function(useTime) {
    var self = this;
    if (self.buffer == null || self.buffer.length < 1) {
        return;
    }
    if (useTime) {
        var time = Date.now() - self._beginTime;
        self.info("用时 " + time + 'ms');
    }
    if (Logger.path) {
        var buffer = self.buffer.map(function(item) {
            return "[" + item.type[0].toUpperCase() + "]" + item.msg;
        });
        var text = buffer.join('\n') + '\n';
        var filename = utils.formatDate(new Date(), "yyyy-MM-dd.log");
        var logFile = path.normalize(Logger.path + "/" + filename);
        fs.appendFile(logFile, text, null);
    } else {
        self.buffer.forEach(function(item) {
            console[item.type](item.msg);
        });
    }
    self.buffer = [];
};