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
Logger.prototype.log = function (msg, time) {
    var self = this;
    self._write('L', msg, time);
};

/**
 * 信息
 **/
Logger.prototype.info = function (msg, time) {
    var self = this;
    self._write('I', msg, time);
};

/**
 * 警告
 **/
Logger.prototype.warn = function (msg, time) {
    var self = this;
    self._write('W', msg, time);
};

/**
 * 错误
 **/
Logger.prototype.error = function (msg, time) {
    var self = this;
    self._write('E', msg, time);
};