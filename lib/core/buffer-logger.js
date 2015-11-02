/**
 * 缓冲日志类
 **/
var BufferLogger = module.exports = function (logger) {
    var self = this;
    self.buffer = [];
    self.logger = logger;
};

BufferLogger.prototype.log = function (msg) {
    var self = this;
    self.buffer.push({
        type: 'log',
        msg: msg,
        time: new Date()
    });
};

BufferLogger.prototype.info = function (msg) {
    var self = this;
    self.buffer.push({
        type: 'info',
        msg: msg,
        time: new Date()
    });
};

BufferLogger.prototype.warn = function (msg) {
    var self = this;
    self.buffer.push({
        type: 'warn',
        msg: msg,
        time: new Date()
    });
};

BufferLogger.prototype.error = function (msg) {
    var self = this;
    self.buffer.push({
        type: 'error',
        msg: msg,
        time: new Date()
    });
};

BufferLogger.prototype.writeBuffer = function () {
    var self = this;
    self.buffer.forEach(function (item) {
        self.logger[item.type](item.msg, item.time);
    });
    self.buffer = [];
};