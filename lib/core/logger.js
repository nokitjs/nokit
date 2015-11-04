/**
 * 定义日志类
 **/
var Logger = module.exports = function (logWriter) {
    var self = this;
    self.logWriter = logWriter;
};

/**
 * 写入日志
 **/
Logger.prototype._write = function (logType, logMsg, logTime) {
    var self = this;
    logTime = logTime || new Date();
    self.logWriter.write(logType, logMsg, logTime)
};

/**
 * 普通日志
 **/
Logger.prototype.log = function (log, time) {
    var self = this;
    self._write('L', log, time);
};

/**
 * 信息
 **/
Logger.prototype.info = function (info, time) {
    var self = this;
    self._write('I', info, time);
};

/**
 * 警告
 **/
Logger.prototype.warn = function (warn, time) {
    var self = this;
    self._write('W', warn, time);
};

/**
 * 错误
 **/
Logger.prototype.error = function (err, time) {
    var self = this;
    err = err || '';
    err = (err.stack || err.message || err).toString();
    self._write('E', err, time);
};