var fs = require("fs");
var path = require("path");

var NOOP = function () { };

/**
 * 定义日志写入类
 **/
var LogWriter = module.exports = function (server) {
    var self = this;
    self.utils = server.require('$./core/utils');
};

/**
 * 静态初始化方法
 * 一般用于和 session 存储服务进行连接
 **/
LogWriter.init = function (server, callback) {
    var logConfigs = server.configs.log;
    var folderExists = fs.existsSync(logConfigs.path);
    if (!folderExists) {
        fs.mkdirSync(server.configs.log.path);
    }
    LogWriter.path = logConfigs.path;
    if (callback) callback();
};

/**
 * 写入日志
 **/
LogWriter.prototype.write = function (logType, logMsg, logTime) {
    var self = this;
    logType = logType.toUpperCase();
    var timeParts = self.utils.formatDate(logTime, "yyyy-MM-dd HH:mm:ss").split(' ');
    var logFile = path.normalize(LogWriter.path + "/" + timeParts[0] + '.log');
    fs.appendFile(logFile,
        "[" + logType + "][" + timeParts[1] + "] " + logMsg,
        NOOP);
};