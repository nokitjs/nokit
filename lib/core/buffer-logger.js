/**
 * 缓冲日志类
 **/
var BufferLogger = module.exports = function (logger) {
    var self = this;
    self.buffer = [];
    self.logger = logger;
};

/**
 * 普通日志
 **/
BufferLogger.prototype.log = function (msg) {
    var self = this;
    if (!self.logger) return;
    self.buffer.push({
        type: 'log',
        msg: msg,
        time: new Date()
    });
};

/**
 * 信息
 **/
BufferLogger.prototype.info = function (msg) {
    var self = this;
    if (!self.logger) return;
    self.buffer.push({
        type: 'info',
        msg: msg,
        time: new Date()
    });
};

/**
 * 警告
 **/
BufferLogger.prototype.warn = function (msg) {
    var self = this;
    if (!self.logger) return;
    self.buffer.push({
        type: 'warn',
        msg: msg,
        time: new Date()
    });
};

/**
 * 错误
 **/
BufferLogger.prototype.error = function (msg) {
    var self = this;
    if (!self.logger) return;
    self.buffer.push({
        type: 'error',
        msg: msg,
        time: new Date()
    });
};

/**
 * 将 buffer 写入日志存储介质
 **/
BufferLogger.prototype.writeBuffer = function () {
    var self = this;
    if (!self.logger) return;
    self.buffer.forEach(function (item) {
        self.logger[item.type](item.msg, item.time);
    });
    self.buffer = [];
};