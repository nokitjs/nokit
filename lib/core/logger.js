var env = require("./env");

/**
 * 定义日志类
 **/
var Logger = function (logWriter) {
    var self = this;
    self.logWriter = logWriter;
};

/**
 * 写日志
 **/
Logger.prototype.write = function (type, text, sync) {
    var self = this;
    if (!self.logWriter) return;
    self.logWriter.write(type, text, sync);
}

/**
 * 普通日志
 **/
Logger.prototype.log = function (text, sync) {
    var self = this;
    self.write('L', text, sync);
};

/**
 * 信息
 **/
Logger.prototype.info = function (text, sync) {
    var self = this;
    self.write('I', text, sync);
};

/**
 * 警告
 **/
Logger.prototype.warn = function (text, sync) {
    var self = this;
    self.write('W', text, sync);
};

/**
 * 错误
 **/
Logger.prototype.error = function (err, sync) {
    var self = this;
    err = err || '';
    err.message = err.message || err || '';
    err.stack = err.stack || '';
    var errText = (err.message + env.EOL + err.stack).toString();
    self.write('E', errText, sync);
};

module.exports = Logger;