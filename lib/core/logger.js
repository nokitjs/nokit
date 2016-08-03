const env = require("./env");

/**
 * 定义日志类
 **/
const Logger = function (logWriter) {
  var self = this;
  self.logWriter = logWriter;
};

/**
 * 写日志
 **/
Logger.prototype.write = function (type, text, options) {
  var self = this;
  options = options || {};
  if (!self.logWriter) {
    if (options.callback) {
      options.callback();
    }
    return;
  }
  self.logWriter.write(type, text, options);
};

/**
 * 普通日志
 **/
Logger.prototype.log = function (text, options) {
  var self = this;
  self.write('L', text, options);
};

/**
 * 信息
 **/
Logger.prototype.info = function (text, options) {
  var self = this;
  self.write('I', text, options);
};

/**
 * 警告
 **/
Logger.prototype.warn = function (text, options) {
  var self = this;
  self.write('W', text, options);
};

/**
 * 错误
 **/
Logger.prototype.error = function (err, options) {
  var self = this;
  err = err || '';
  err.message = err.message || err || '';
  err.stack = err.stack || '';
  var errText = (err.message + env.EOL + err.stack).toString();
  self.write('E', errText, options);
};

module.exports = Logger;